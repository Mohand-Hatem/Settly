"use client";

import React, { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/api/client";
import { authClient, ROLE_HOME, roleOf, safeCallbackUrl } from "@/lib/auth-client";
import { AuthFrame, FormAlert, SubmitButton } from "../_components/AuthFrame";
import { PhoneField, toInternational } from "../_components/PhoneField";

/**
 * Complete profile (spec S1-06, #106). Google sign-in supplies no phone, so the phone is collected
 * here before any portal page can be used (#60). Public pages stay browsable.
 */
function CompleteProfile() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = safeCallbackUrl(params.get("callbackUrl"));
  const { data: session, refetch } = authClient.useSession();

  const [dialCode, setDialCode] = useState("+20");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (phone.replace(/\D/g, "").length < 7) return setError("Please enter a valid mobile number.");
    setLoading(true);
    const { error: saveError } = await api.PATCH("/api/v1/me", {
      body: { phone: toInternational(dialCode, phone) },
    });
    setLoading(false);
    if (saveError) return setError("That number doesn't look valid. Please check it and try again.");
    await refetch();
    router.replace(callbackUrl ?? ROLE_HOME[roleOf(session?.user)]);
    router.refresh();
  };

  return (
    <AuthFrame
      title="Add your mobile number"
      description={`Welcome${session?.user?.name ? `, ${session.user.name.split(" ")[0]}` : ""}. We need a mobile number before you can use your account.`}
    >
      <form className="auth-form" onSubmit={onSubmit} noValidate>
        <FormAlert message={error} />
        <PhoneField dialCode={dialCode} onDialCodeChange={setDialCode} value={phone} onChange={setPhone} />
        <SubmitButton loading={loading} label="Save and continue" loadingLabel="Saving…" />
      </form>
    </AuthFrame>
  );
}

export default function CompleteProfilePage() {
  return (
    <Suspense fallback={null}>
      <CompleteProfile />
    </Suspense>
  );
}
