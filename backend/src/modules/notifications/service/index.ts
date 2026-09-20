import { notificationRepository } from "../repository/index.js";
import { broadcastToUser } from "../../messaging/events/index.js";
import { sendEmail } from "../../../shared/email/resend.js";
import { logger } from "../../../shared/logger/index.js";
import type {
  CreateNotificationInput,
  NotificationCategory,
  NotificationDto,
  NotificationListResponse,
  UnreadCountResponse,
} from "../types/index.js";

function determineCategory(type: string): NotificationCategory {
  switch (type) {
    case "OFFER_SUBMITTED":
    case "OFFER_COUNTERED":
    case "OFFER_ACCEPTED":
    case "OFFER_REJECTED":
    case "OFFER_WITHDRAWN":
    case "OFFER_SUPERSEDED":
    case "DEPOSIT_CONFIRMED":
    case "DEPOSIT_SUPERSEDED":
    case "DEPOSIT_DEADLINE_APPROACHING":
    case "SALE_COMPLETED":
    case "BUYER_CONFIRMED_SALE":
    case "AGENT_CONFIRMED_SALE":
    case "SALE_DISPUTED":
    case "SALE_FELL_THROUGH":
    case "SALE_REVIEW_EXTENDED":
      return "DEALS";

    case "VIEWING_REQUESTED":
    case "VIEWING_CONFIRMED":
    case "VIEWING_DECLINED":
    case "VIEWING_CANCELLED":
      return "VIEWINGS";

    case "NEW_MESSAGE":
      return "MESSAGES";

    default:
      return "SYSTEM";
  }
}

export function formatNotification(raw: {
  id: string;
  type: string;
  params: unknown;
  isRead: boolean;
  readAt: Date | null;
  createdAt: Date;
}): NotificationDto {
  const p = (typeof raw.params === "object" && raw.params !== null
    ? raw.params
    : {}) as Record<string, unknown>;

  const category = determineCategory(raw.type);
  let title = "Settly Alert";
  let body = "You have an account update.";
  let actionUrl = "/buyer";

  const propTitle = (p.propertyTitle as string) || "the property";
  const price = typeof p.priceEgp === "number" ? `${p.priceEgp.toLocaleString("en-US")} EGP` : "";
  const deposit = typeof p.amountEgp === "number" ? `${p.amountEgp.toLocaleString("en-US")} EGP` : "";
  const scheduled = (p.scheduledAt as string) || "the scheduled time";
  const userRole = (p.recipientRole as string) || "buyer";

  switch (raw.type) {
    case "VIEWING_REQUESTED":
      title = `Viewing Requested: ${propTitle}`;
      body = `${(p.buyerName as string) || "A buyer"} requested a viewing appointment for ${scheduled}.`;
      actionUrl = "/agent/calendar";
      break;

    case "VIEWING_CONFIRMED":
      title = `Viewing Confirmed: ${propTitle}`;
      body = `Your viewing has been confirmed for ${scheduled}. Check your viewing pass in your dashboard.`;
      actionUrl = userRole === "agent" ? "/agent/calendar" : "/buyer/viewings";
      break;

    case "VIEWING_DECLINED":
      title = `Viewing Request Declined`;
      body = `The viewing appointment request for ${propTitle} could not be accommodated.`;
      actionUrl = userRole === "agent" ? "/agent/calendar" : "/buyer/viewings";
      break;

    case "VIEWING_CANCELLED":
      title = `Viewing Cancelled: ${propTitle}`;
      body = `The viewing scheduled for ${scheduled} has been cancelled.`;
      actionUrl = userRole === "agent" ? "/agent/calendar" : "/buyer/viewings";
      break;

    case "OFFER_SUBMITTED":
      title = `New Offer Received: ${price || propTitle}`;
      body = `${(p.buyerName as string) || "A buyer"} submitted a purchase offer for ${propTitle}. Review the terms.`;
      actionUrl = "/agent/offers";
      break;

    case "OFFER_COUNTERED":
      title = `Counter-Offer Received: ${price || propTitle}`;
      body = `An amended offer was submitted for ${propTitle}. Review terms and respond.`;
      actionUrl = userRole === "agent" ? "/agent/offers" : "/buyer/offers";
      break;

    case "OFFER_ACCEPTED":
      title = `Offer Accepted! 72h Deposit Window Active`;
      body = `Your purchase offer of ${price} on ${propTitle} was accepted! Please place your 5% reservation deposit within 72 hours.`;
      actionUrl = p.offerId ? `/buyer/offers/${p.offerId}/deposit` : "/buyer/offers";
      break;

    case "OFFER_REJECTED":
      title = `Offer Declined`;
      body = `Your offer on ${propTitle} was not accepted by the seller.`;
      actionUrl = "/buyer/offers";
      break;

    case "OFFER_WITHDRAWN":
      title = `Offer Retracted`;
      body = `An offer on ${propTitle} has been withdrawn.`;
      actionUrl = "/agent/offers";
      break;

    case "OFFER_SUPERSEDED":
      title = `Offer Superseded`;
      body = `Another buyer completed the reservation deposit for ${propTitle}. Your offer has been superseded.`;
      actionUrl = "/buyer/offers";
      break;

    case "DEPOSIT_CONFIRMED":
      title = `Reservation Deposit Confirmed!`;
      body = `Reservation deposit of ${deposit} confirmed for ${propTitle}. The property is now officially RESERVED.`;
      actionUrl = p.offerId ? `/buyer/offers/${p.offerId}/deposit/callback` : "/buyer/offers";
      break;

    case "DEPOSIT_SUPERSEDED":
      title = `Deposit Cancelled / Released`;
      body = `Another buyer completed checkout first on ${propTitle}. Any pending holds were released.`;
      actionUrl = "/buyer/offers";
      break;

    case "DEPOSIT_DEADLINE_APPROACHING":
      title = `Urgent: Deposit Window Expiring Soon`;
      body = `Your 72-hour reservation deposit deadline for ${propTitle} is approaching. Secure the property before it expires.`;
      actionUrl = p.offerId ? `/buyer/offers/${p.offerId}/deposit` : "/buyer/offers";
      break;

    case "NEW_MESSAGE":
      title = `New Message from ${(p.senderName as string) || "Contact"}`;
      body = (p.snippet as string) || `You have a new inquiry message regarding ${propTitle}.`;
      actionUrl = p.conversationId ? `/${userRole === "agent" ? "agent" : "buyer"}/messages?id=${p.conversationId}` : `/${userRole === "agent" ? "agent" : "buyer"}/messages`;
      break;

    case "SALE_COMPLETED":
      title = `🎉 Property Sale Completed!`;
      body = (p.message as string) || `Both parties have confirmed conveyance for ${propTitle}. The property is officially SOLD.`;
      actionUrl = userRole === "agent" ? "/agent/offers" : "/buyer/offers";
      break;

    case "BUYER_CONFIRMED_SALE":
      title = `Buyer Confirmed Sale Completion`;
      body = (p.message as string) || `Buyer confirmed conveyance for ${propTitle}. Please review and confirm to mark SOLD.`;
      actionUrl = "/agent/offers";
      break;

    case "AGENT_CONFIRMED_SALE":
      title = `Agent Confirmed Sale Completion`;
      body = (p.message as string) || `Listing agent confirmed conveyance for ${propTitle}. Please confirm to finalize.`;
      actionUrl = "/buyer/offers";
      break;

    case "SALE_DISPUTED":
      title = `⚠️ Conveyance Dispute Raised`;
      body = (p.message as string) || `A dispute was reported on ${propTitle}. Case is now in Admin Review.`;
      actionUrl = userRole === "admin" ? "/admin/sales" : userRole === "agent" ? "/agent/offers" : "/buyer/offers";
      break;

    case "SALE_FELL_THROUGH":
      title = `Sale Review Concluded: Fell Through`;
      body = (p.message as string) || `The reservation on ${propTitle} fell through.`;
      actionUrl = userRole === "agent" ? "/agent/offers" : "/buyer/offers";
      break;

    case "SALE_REVIEW_EXTENDED":
      title = `Sale Review Period Extended`;
      body = (p.message as string) || `Administrative review for ${propTitle} has been granted an extension.`;
      actionUrl = userRole === "agent" ? "/agent/offers" : "/buyer/offers";
      break;

    default:
      title = (p.title as string) || "Settly Notice";
      body = (p.body as string) || (p.message as string) || "You have a new account notification.";
      actionUrl = (p.actionUrl as string) || (p.link as string) || `/${userRole === "agent" ? "agent" : "buyer"}`;
      break;
  }

  return {
    id: raw.id,
    type: raw.type,
    category,
    title,
    body,
    actionUrl,
    isRead: raw.isRead,
    readAt: raw.readAt ? raw.readAt.toISOString() : null,
    createdAt: raw.createdAt.toISOString(),
    params: p,
  };
}

export class NotificationService {
  async listUserNotifications(
    userId: string,
    options?: {
      unreadOnly?: boolean;
      cursor?: string;
      limit?: number;
    }
  ): Promise<NotificationListResponse> {
    const [{ items, nextCursor }, unreadCount, totalCount] = await Promise.all([
      notificationRepository.listUserNotifications(userId, options),
      notificationRepository.countUnread(userId),
      notificationRepository.countTotal(userId),
    ]);

    return {
      items: items.map(formatNotification),
      unreadCount,
      totalCount,
      nextCursor,
    };
  }

  async getUnreadCount(userId: string): Promise<UnreadCountResponse> {
    const unreadCount = await notificationRepository.countUnread(userId);
    return { unreadCount };
  }

  async markAsRead(id: string, userId: string): Promise<{ success: boolean }> {
    const result = await notificationRepository.markAsRead(id, userId);
    return { success: result.count > 0 };
  }

  async markAllAsRead(userId: string): Promise<{ success: boolean; count: number }> {
    const result = await notificationRepository.markAllAsRead(userId);
    return { success: true, count: result.count };
  }

  async deleteNotification(id: string, userId: string): Promise<{ success: boolean }> {
    const result = await notificationRepository.deleteNotification(id, userId);
    return { success: result.count > 0 };
  }

  /**
   * Authoritative notification creation inside business transaction.
   * Dispatches real-time WebSocket signal and best-effort email if requested.
   */
  async notifyUser(
    input: CreateNotificationInput,
    tx?: Parameters<typeof notificationRepository.createNotification>[1]
  ): Promise<NotificationDto> {
    const raw = await notificationRepository.createNotification(
      {
        userId: input.userId,
        type: input.type,
        params: input.params,
      },
      tx
    );

    const formatted = formatNotification(raw);

    // Broadcast real-time signal via WebSocket
    try {
      broadcastToUser(input.userId, {
        type: "notification:new",
        notification: formatted,
      });
    } catch (err) {
      logger.warn({ err, userId: input.userId }, "Failed to broadcast notification signal via WebSocket");
    }

    // Best-effort transactional email delivery
    if (input.sendEmail) {
      void this.dispatchEmailNotification(input.userId, formatted).catch((err) => {
        logger.warn({ err, userId: input.userId }, "Best-effort notification email dispatch failed");
      });
    }

    return formatted;
  }

  private async dispatchEmailNotification(userId: string, notif: NotificationDto): Promise<void> {
    try {
      const user = await notificationRepository.findUserEmailAndName(userId);

      if (!user?.email) return;

      const html = `
        <div style="font-family: 'Plus Jakarta Sans', system-ui, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #131D36; background: #F7F6F3; border-radius: 8px;">
          <div style="border-bottom: 2px solid #C69749; padding-bottom: 12px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #131D36; font-size: 20px;">Settly Alert</h2>
          </div>
          <h3 style="margin-top: 0; color: #131D36;">${notif.title}</h3>
          <p style="font-size: 15px; line-height: 1.6; color: #414651;">${notif.body}</p>
          <div style="margin-top: 24px;">
            <a href="http://localhost:3000${notif.actionUrl}" style="background-color: #131D36; color: #FFFFFF; text-decoration: none; padding: 10px 20px; font-weight: 600; border-radius: 6px; display: inline-block;">
              View in Settly Portal
            </a>
          </div>
        </div>
      `;

      await sendEmail({
        to: user.email,
        subject: `[Settly] ${notif.title}`,
        html,
        text: `${notif.title}\n\n${notif.body}\n\nView details: http://localhost:3000${notif.actionUrl}`,
      });
    } catch (err) {
      logger.error({ err, userId }, "Failed to send notification email");
    }
  }
}

export const notificationService = new NotificationService();
