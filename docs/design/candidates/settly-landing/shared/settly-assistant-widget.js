/**
 * Settly AI Assistant — Universal Client Widget
 * Mounts persistent bottom-right popup trigger FAB and docked sliding overlay drawer
 * across all Settly pages with instant direct navigation to the dedicated /assistant screen.
 */
(function () {
  // Prevent mounting inside the dedicated assistant pages
  if (window.location.pathname.includes('/assistant/')) {
    return;
  }

  function initSettlyAssistantWidget() {
    if (document.getElementById('settlyAiTrigger')) {
      return; // Already present
    }

    const isRtl = document.documentElement.getAttribute('dir') === 'rtl' || document.documentElement.lang === 'ar';

    // Compute relative path to assistant directory and images
    const currentPath = window.location.pathname.replace(/\\/g, '/');
    let assistantUrl = isRtl ? '../assistant/ar.html' : '../assistant/index.html';
    let imagesBase = '../../../../../Images/web/';

    if (currentPath.endsWith('index.html') && !currentPath.includes('/public/') && !currentPath.includes('/buyer-dashboard/') && !currentPath.includes('/agent-dashboard/') && !currentPath.includes('/admin/') && !currentPath.includes('/auth/')) {
      assistantUrl = isRtl ? 'assistant/ar.html' : 'assistant/index.html';
      imagesBase = 'Images/web/';
    }

    // Bilingual strings
    const i18n = isRtl ? {
      fabTooltip: 'استشارة المساعد العقاري الذكي',
      fabAria: 'استشارة المساعد العقاري الذكي',
      title: 'المساعد العقاري الذكي',
      subtitle: 'السجل العقاري: معتمد · تفويض المربع الذهبي',
      expandTitle: 'الانتقال إلى مساحة العمل المستقلة الكاملة',
      bannerText: 'هل تبحث عن مساحة العمل الكاملة؟',
      bannerLink: 'فتح المساعد المخصص ↗',
      closeTitle: 'إغلاق المساعد',
      chatTab: 'المحادثة',
      agentTab: 'وكيل الترشيحات',
      context: 'السياق: استشارات عقارية ذكية',
      userMsg: 'هل عقد التخصيص لهذه الفيلا في ليك فيو موثق رسمياً، وكيف يقارن السعر بمتوسط المربع الذهبي؟',
      aiAuthor: 'مساعد سيتلي الذكي',
      aiBadge: 'استشارة معتمدة',
      aiTime: '14:35 بتوقيت القاهرة',
      asstP1: 'نعم، تحمل فيلا ليك فيو عقد تخصيص أصلي معتمد وخالٍ تماماً من أي تعارضات مساحية أو نزاعات ملكية',
      cite1: 'عقد #LV-8821',
      asstP2: 'بسعر <strong>78,000,000 جنيه مصري</strong> (720م² مباني على أرض 950م²)، يبلغ التقييم <strong>108,333 جنيه/م²</strong> — أي ما يقارب <strong>+3.2%</strong> أعلى من متوسط المربع الذهبي، مبرراً بالإطلالة المباشرة على البحيرة والملعب',
      cite2: 'مؤشر المربع الذهبي',
      actTag: 'إجراء مقترح لحجز معاينة',
      actStatus: 'يتطلب تأكيدك المسبق',
      actTitle: 'معاينة خاصة حصرية: فيلا ليك فيو',
      actDesc: 'برفقة المستشار العقاري المعتمد <strong>كريم المنسي (ترخيص #EG-99120-B)</strong>. سيتم إصدار تصريح الدخول الأمني فور موافقتك.',
      lblDate: 'التاريخ المقترح',
      valDate: 'غداً، 14 سبتمبر',
      lblTime: 'الفترة الزمنية',
      valTime: '04:30 مساءً',
      lblVal: 'القيمة التعاقدية',
      valVal: '78.0 مليون جنيه',
      btnNotNow: 'ليس الآن',
      btnConfirm: 'تأكيد حجز المعاينة',
      agentTag: 'وكيل بحث عقاري ذكي ومستقل',
      agentTitle: 'قائمة ترشيحات منتقاة للفلل الفاخرة',
      agentStatus: 'تم تنفيذ الخطة · 3 عقارات مطابقة',
      traceHdr: 'سجل التنفيذ الذاتي للخطة',
      traceLatency: 'زمن الاستجابة: 1.1 ثانية',
      step1Txt: 'جارٍ مسح السجل المساحي بالقاهرة الكبرى (642 تكليفاً)...',
      step1Val: 'تم مسح 642',
      step2Txt: 'تصفية الفلل 3+ غرف نوم ضمن نطاق الميزانية...',
      step2Val: '18 عقاراً مؤهلاً',
      step3Txt: 'التحقق من خلو عقود التخصيص من النزاعات...',
      step3Val: 'مطابقة تامة 100%',
      step4Txt: 'فحص المواعيد المتاحة لدى الوسطاء المعتمدين...',
      step4Val: 'المواعيد متاحة',
      step5Txt: 'صياغة أفضل 3 ترشيحات مستندة لاستقرار القيمة...',
      step5Val: 'القائمة جاهزة',
      mini1Loc: 'ميفيدا · المربع الذهبي',
      mini1Name: 'قصر كريسينت ليك فرونت',
      mini1Price: '54,000,000 جنيه مصري',
      mini1Specs: '5 غرف · 6 حمامات · 580م²',
      mini2Loc: 'قطامية ديونز',
      mini2Name: 'فيلا سيجنتشر فيرواي 14',
      mini2Price: '44,500,000 جنيه مصري',
      mini2Specs: '4 غرف · 5 حمامات · 520م²',
      btnRequest: 'طلب معاينة',
      placeholder: 'اسأل عن عقود الملكية، مقارنات الأسعار، أو اطلب معاينة...',
      disclaimer: 'استشارات سيتلي الذكية · مستندة للسجلات المعتمدة · التعاقدات عبر وسطاء مرخصين'
    } : {
      fabTooltip: 'Ask Settly AI Concierge',
      fabAria: 'Ask Settly AI Concierge',
      title: 'Settly AI Concierge',
      subtitle: 'Cadastre Verified · Golden Square Mandate',
      expandTitle: 'Expand to dedicated full workspace',
      bannerText: 'Need the full workspace?',
      bannerLink: 'Open Dedicated Assistant ↗',
      closeTitle: 'Close Assistant',
      chatTab: 'Chat',
      agentTab: 'Shortlist Agent',
      context: 'Context: Intelligent Advisory',
      userMsg: 'Is this Lake View villa title deed fully authenticated, and how does the price compare to the Golden Square baseline?',
      aiAuthor: 'Settly AI Concierge',
      aiBadge: 'Authenticated Advisory',
      aiTime: '14:35 EET',
      asstP1: 'Yes, this Lake View villa carries an authenticated primary allocation deed with zero title collisions',
      cite1: 'Deed #LV-8821',
      asstP2: 'At <strong>78,000,000 EGP</strong> (720m² built on 950m² plot), the valuation stands at <strong>108,333 EGP/m²</strong> — approximately <strong>+3.2%</strong> above the Q3 Golden Square average, justified by direct fairway lake frontage',
      cite2: 'Golden Square Index',
      actTag: 'PROPOSED VIEWING APPOINTMENT',
      actStatus: 'Requires Your Confirmation',
      actTitle: 'Private Escorted Tour: Lake View Villa',
      actDesc: 'Accompanied by Senior Licensed Broker <strong>Karim El-Mansy (#EG-99120-B)</strong>. Security compound gate pass PIN will be issued upon your approval.',
      lblDate: 'PROPOSED DATE',
      valDate: 'Tomorrow, 14 Sep',
      lblTime: 'TIME WINDOW',
      valTime: '04:30 PM EET',
      lblVal: 'VALUATION',
      valVal: '78.0M EGP',
      btnNotNow: 'Not now',
      btnConfirm: 'Confirm & Book Viewing',
      agentTag: 'AUTONOMOUS MULTI-STEP AGENT',
      agentTitle: 'Curated Lakefront & Golf Shortlist',
      agentStatus: 'Plan Executed · 3 Verified Matches',
      traceHdr: 'Autonomous Execution Trace',
      traceLatency: 'Latency: 1.1s',
      step1Txt: 'Searching Greater Cairo Cadastre (642 mandates)...',
      step1Val: '642 Scanned',
      step2Txt: 'Narrowing to 3+ bedrooms under target budget...',
      step2Val: '18 Qualified',
      step3Txt: 'Validating developer allocation deeds & zero title disputes...',
      step3Val: '100% Deed Match',
      step4Txt: 'Checking private viewing calendar slots with listing brokers...',
      step4Val: 'Slots Available',
      step5Txt: 'Synthesizing top recommendations based on resale resilience...',
      step5Val: 'Shortlist Ready',
      mini1Loc: 'MIVIDA · GOLDEN SQUARE',
      mini1Name: 'Crescent Lakefront Mansion',
      mini1Price: '54,000,000 EGP',
      mini1Specs: '5 Beds · 6 Baths · 580m²',
      mini2Loc: 'KATAMEYA DUNES',
      mini2Name: 'Signature Fairway Villa 14',
      mini2Price: '44,500,000 EGP',
      mini2Specs: '4 Beds · 5 Baths · 520m²',
      btnRequest: 'Request Viewing',
      placeholder: 'Ask about deeds, price comps, or request viewing...',
      disclaimer: 'Settly AI advisory · Cadastre backed · Finalized with licensed syndicate brokers'
    };

    // Construct DOM Elements
    const fragment = document.createDocumentFragment();

    // 1. Floating Action Button (FAB)
    const fab = document.createElement('button');
    fab.className = 'settly-ai-trigger-fab';
    fab.id = 'settlyAiTrigger';
    fab.setAttribute('aria-label', i18n.fabAria);
    fab.onclick = () => window.openAssistantOverlay();
    fab.innerHTML = `
      <div class="fab-pulse-halo"></div>
      <div class="fab-inner">
        <div class="fab-logo-plate">
          <img src="${imagesBase}logo.png" alt="Settly" class="fab-logo-img">
        </div>
        <span class="fab-live-indicator"></span>
      </div>
      <span class="fab-tooltip">${i18n.fabTooltip}</span>
    `;
    fragment.appendChild(fab);

    // 2. Backdrop
    const backdrop = document.createElement('div');
    backdrop.className = 'settly-overlay-backdrop';
    backdrop.id = 'settlyOverlayBackdrop';
    backdrop.onclick = () => window.closeAssistantOverlay();
    fragment.appendChild(backdrop);

    // 3. Sliding Overlay Drawer
    const overlay = document.createElement('aside');
    overlay.className = 'settly-assistant-overlay';
    overlay.id = 'settlyAssistantOverlay';
    overlay.setAttribute('aria-label', 'Settly AI Assistant Drawer');

    overlay.innerHTML = `
      <!-- Header -->
      <div class="overlay-header">
        <div class="overlay-hdr-left">
          <div class="overlay-hdr-badge">
            <img src="${imagesBase}logo.png" alt="Settly" class="hdr-badge-logo">
          </div>
          <div>
            <div class="hdr-assistant-title">${i18n.title}</div>
            <div class="hdr-assistant-sub">
              <span class="dot-live"></span>
              <span>${i18n.subtitle}</span>
            </div>
          </div>
        </div>
        <div class="overlay-hdr-actions">
          <a href="${assistantUrl}" class="overlay-icon-btn" title="${i18n.expandTitle}" aria-label="Expand to full assistant page">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="15 3 21 3 21 9"></polyline>
              <polyline points="9 21 3 21 3 15"></polyline>
              <line x1="21" y1="3" x2="14" y2="10"></line>
              <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
          </a>
          <button type="button" class="overlay-icon-btn" onclick="window.closeAssistantOverlay()" title="${i18n.closeTitle}" aria-label="Close Assistant">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
      </div>

      <!-- Prominent Full Page Banner -->
      <div class="overlay-full-page-banner">
        <span>${i18n.bannerText}</span>
        <a href="${assistantUrl}">${i18n.bannerLink}</a>
      </div>

      <!-- Mode Switcher Bar -->
      <div class="overlay-modes-bar">
        <div class="overlay-pill-group">
          <button type="button" class="overlay-pill-btn active" id="ovlBtnChat" onclick="window.setOverlayMode('chat')">${i18n.chatTab}</button>
          <button type="button" class="overlay-pill-btn" id="ovlBtnAgent" onclick="window.setOverlayMode('agent')">${i18n.agentTab}</button>
        </div>
        <span class="overlay-context-tag">${i18n.context}</span>
      </div>

      <!-- Scrollable Body -->
      <div class="overlay-body" id="overlayBody">
        <!-- MODE A: Chat Thread -->
        <div id="ovlChatView" style="display: flex; flex-direction: column; gap: 14px;">
          <div class="ovl-msg-row user">
            <div class="ovl-user-bubble">${i18n.userMsg}</div>
          </div>

          <div class="ovl-assistant-card">
            <div class="ovl-msg-header">
              <div class="ovl-avatar">AI</div>
              <span class="ovl-meta-author">${i18n.aiAuthor}</span>
              <span class="ovl-verified-tag">${i18n.aiBadge}</span>
              <span class="ovl-meta-time">${i18n.aiTime}</span>
            </div>

            <div class="ovl-assistant-bubble">
              <p>
                ${i18n.asstP1} 
                <a href="#cite-deed" class="ovl-citation-chip" title="Verified with New Urban Communities Authority">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>
                  <span>${i18n.cite1}</span>
                </a>.
              </p>
              <p>
                ${i18n.asstP2} 
                <a href="#cite-index" class="ovl-citation-chip" title="Settly Q3 2026 Golden Square Benchmark">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <span>${i18n.cite2}</span>
                </a>.
              </p>
            </div>

            <!-- Confirmable Action Card -->
            <div class="ovl-confirmable-card" id="ovlActionCard">
              <div class="ovl-action-header">
                <div class="ovl-action-tag">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <span>${i18n.actTag}</span>
                </div>
                <span class="ovl-action-status">${i18n.actStatus}</span>
              </div>
              <div class="ovl-action-title">${i18n.actTitle}</div>
              <div class="ovl-action-desc">${i18n.actDesc}</div>
              <div class="ovl-action-specs">
                <div class="spec-item">
                  <span class="lbl">${i18n.lblDate}</span>
                  <span class="val">${i18n.valDate}</span>
                </div>
                <div class="spec-item">
                  <span class="lbl">${i18n.lblTime}</span>
                  <span class="val">${i18n.valTime}</span>
                </div>
                <div class="spec-item">
                  <span class="lbl">${i18n.lblVal}</span>
                  <span class="val">${i18n.valVal}</span>
                </div>
              </div>
              <div class="ovl-action-btn-row">
                <button type="button" class="btn-ovl-secondary" onclick="window.dismissOvlAction()">${i18n.btnNotNow}</button>
                <button type="button" class="btn-ovl-primary" onclick="window.confirmOvlAction()">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>${i18n.btnConfirm}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- MODE B: Shortlist Agent Variant View -->
        <div id="ovlAgentView" class="overlay-agent-container" style="display: none;">
          <div class="ovl-agent-banner">
            <span class="agent-tag">${i18n.agentTag}</span>
            <div class="agent-title">${i18n.agentTitle}</div>
            <div class="agent-status-tag">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>${i18n.agentStatus}</span>
            </div>
          </div>

          <div class="ovl-plan-card">
            <div class="plan-card-hdr">
              <span>${i18n.traceHdr}</span>
              <span>${i18n.traceLatency}</span>
            </div>
            <div class="plan-steps-list">
              <div class="plan-step">
                <div class="step-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                <span class="step-txt">${i18n.step1Txt}</span>
                <span class="step-val">${i18n.step1Val}</span>
              </div>
              <div class="plan-step">
                <div class="step-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                <span class="step-txt">${i18n.step2Txt}</span>
                <span class="step-val">${i18n.step2Val}</span>
              </div>
              <div class="plan-step">
                <div class="step-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                <span class="step-txt">${i18n.step3Txt}</span>
                <span class="step-val">${i18n.step3Val}</span>
              </div>
              <div class="plan-step">
                <div class="step-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                <span class="step-txt">${i18n.step4Txt}</span>
                <span class="step-val">${i18n.step4Val}</span>
              </div>
              <div class="plan-step">
                <div class="step-check"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>
                <span class="step-txt">${i18n.step5Txt}</span>
                <span class="step-val">${i18n.step5Val}</span>
              </div>
            </div>
          </div>

          <div class="ovl-mini-cards-stack">
            <div class="ovl-mini-card">
              <div class="mini-img-wrap">
                <img src="${imagesBase}2.jpg" alt="${i18n.mini1Name}" />
                <span class="mini-badge">99.4% Match</span>
              </div>
              <div class="mini-info">
                <span class="mini-loc">${i18n.mini1Loc}</span>
                <div class="mini-name">${i18n.mini1Name}</div>
                <div class="mini-price">${i18n.mini1Price}</div>
                <div class="mini-specs">${i18n.mini1Specs}</div>
                <button type="button" class="btn-mini-request" id="btnMiniWidget1" onclick="window.requestMiniViewing('${i18n.mini1Name}', 'btnMiniWidget1')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>${i18n.btnRequest}</span>
                </button>
              </div>
            </div>

            <div class="ovl-mini-card">
              <div class="mini-img-wrap">
                <img src="${imagesBase}3.jpg" alt="${i18n.mini2Name}" />
                <span class="mini-badge">98.8% Match</span>
              </div>
              <div class="mini-info">
                <span class="mini-loc">${i18n.mini2Loc}</span>
                <div class="mini-name">${i18n.mini2Name}</div>
                <div class="mini-price">${i18n.mini2Price}</div>
                <div class="mini-specs">${i18n.mini2Specs}</div>
                <button type="button" class="btn-mini-request" id="btnMiniWidget2" onclick="window.requestMiniViewing('${i18n.mini2Name}', 'btnMiniWidget2')">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  <span>${i18n.btnRequest}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bottom Composer -->
      <div class="overlay-composer">
        <div class="ovl-composer-row">
          <button type="button" class="composer-icon-btn" title="Attach Document" aria-label="Attach Document">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>
          <input type="text" class="ovl-composer-input" id="ovlComposerInput" placeholder="${i18n.placeholder}" />
          <button type="button" class="ovl-btn-send" onclick="window.sendOvlMessage()" aria-label="Send query">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
        <div class="ovl-composer-disclaimer">${i18n.disclaimer}</div>
      </div>
    `;
    fragment.appendChild(overlay);

    // 4. Toast Notification
    const toast = document.createElement('div');
    toast.className = 'ovl-toast';
    toast.id = 'ovlToast';
    toast.textContent = isRtl ? 'تم تأكيد الإجراء بنجاح' : 'Action confirmed';
    fragment.appendChild(toast);

    document.body.appendChild(fragment);

    // Check URL Hash for initial state
    handleWidgetHash();
  }

  // Global Interactive Functions
  window.openAssistantOverlay = function (mode) {
    const ovl = document.getElementById('settlyAssistantOverlay');
    const bdrop = document.getElementById('settlyOverlayBackdrop');
    if (ovl && bdrop) {
      ovl.classList.add('open');
      bdrop.classList.add('open');
      document.body.style.overflow = 'hidden';
      if (mode) {
        window.setOverlayMode(mode);
      }
    }
  };

  window.closeAssistantOverlay = function () {
    const ovl = document.getElementById('settlyAssistantOverlay');
    const bdrop = document.getElementById('settlyOverlayBackdrop');
    if (ovl && bdrop) {
      ovl.classList.remove('open');
      bdrop.classList.remove('open');
      document.body.style.overflow = '';
    }
  };

  window.setOverlayMode = function (mode) {
    const chatView = document.getElementById('ovlChatView');
    const agentView = document.getElementById('ovlAgentView');
    const btnChat = document.getElementById('ovlBtnChat');
    const btnAgent = document.getElementById('ovlBtnAgent');
    if (!chatView || !agentView) return;

    if (mode === 'agent') {
      chatView.style.display = 'none';
      agentView.style.display = 'flex';
      if (btnChat) btnChat.classList.remove('active');
      if (btnAgent) btnAgent.classList.add('active');
    } else {
      chatView.style.display = 'flex';
      agentView.style.display = 'none';
      if (btnChat) btnChat.classList.add('active');
      if (btnAgent) btnAgent.classList.remove('active');
    }
  };

  window.sendOvlMessage = function () {
    const input = document.getElementById('ovlComposerInput');
    if (!input) return;
    const txt = input.value.trim();
    if (!txt) return;

    const chatView = document.getElementById('ovlChatView');
    const newRow = document.createElement('div');
    newRow.className = 'ovl-msg-row user';
    newRow.innerHTML = `<div class="ovl-user-bubble">${txt}</div>`;
    chatView.appendChild(newRow);
    input.value = '';

    const body = document.getElementById('overlayBody');
    if (body) body.scrollTop = body.scrollHeight;

    const isRtl = document.documentElement.getAttribute('dir') === 'rtl' || document.documentElement.lang === 'ar';
    triggerWidgetToast(isRtl ? 'جارٍ تحليل السجلات المساحية...' : 'Analyzing mandate registry...');
  };

  window.confirmOvlAction = function () {
    const card = document.getElementById('ovlActionCard');
    if (!card) return;
    const isRtl = document.documentElement.getAttribute('dir') === 'rtl' || document.documentElement.lang === 'ar';
    card.style.borderColor = '#3D5A4C';
    card.innerHTML = isRtl ? `
      <div style="display: flex; align-items: center; gap: 8px; color: #3D5A4C; font-weight: 700; font-size: 0.8125rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>تم تأكيد حجز المعاينة وإصدار التصريح</span>
      </div>
      <div style="font-size: 0.75rem; color: #4C5878; line-height: 1.4;">
        تم إرسال إشعار للمستشار كريم المنسي. رمز تصريح البوابة: <strong style="font-family: 'JetBrains Mono', monospace;">#EG-4992-LV</strong>. تم إرسال رسالة نصية لهاتفك.
      </div>
    ` : `
      <div style="display: flex; align-items: center; gap: 8px; color: #3D5A4C; font-weight: 700; font-size: 0.8125rem;">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        <span>Viewing Confirmed & Pass Dispatched</span>
      </div>
      <div style="font-size: 0.75rem; color: #4C5878; line-height: 1.4;">
        Broker Karim El-Mansy has received your confirmation. Gate Pass PIN: <strong style="font-family: 'JetBrains Mono', monospace;">#EG-4992-LV</strong>. SMS confirmation sent.
      </div>
    `;
    triggerWidgetToast(isRtl ? 'تم تأكيد المعاينة وإصدار التصريح!' : 'Viewing confirmed and pass issued!');
  };

  window.dismissOvlAction = function () {
    const card = document.getElementById('ovlActionCard');
    if (!card) return;
    card.style.opacity = '0.5';
    card.style.pointerEvents = 'none';
    const isRtl = document.documentElement.getAttribute('dir') === 'rtl' || document.documentElement.lang === 'ar';
    triggerWidgetToast(isRtl ? 'تم صرف النظر عن المقترح.' : 'Viewing proposal dismissed.');
  };

  window.requestMiniViewing = function (propName, btnId) {
    const btn = document.getElementById(btnId);
    if (btn) {
      btn.style.backgroundColor = '#3D5A4C';
      btn.innerHTML = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg> <span>Requested</span>';
    }
    const isRtl = document.documentElement.getAttribute('dir') === 'rtl' || document.documentElement.lang === 'ar';
    triggerWidgetToast(isRtl ? `تم طلب معاينة لـ ${propName}` : `Viewing requested for ${propName}`);
  };

  function triggerWidgetToast(msg) {
    const toast = document.getElementById('ovlToast');
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add('visible');
    setTimeout(() => toast.classList.remove('visible'), 3200);
  }

  function handleWidgetHash() {
    const hash = window.location.hash.replace('#', '');
    if (hash === 'assistant-chat') {
      window.openAssistantOverlay('chat');
    } else if (hash === 'assistant-agent') {
      window.openAssistantOverlay('agent');
    }
  }

  window.addEventListener('DOMContentLoaded', initSettlyAssistantWidget);
  window.addEventListener('hashchange', handleWidgetHash);
  if (document.readyState === 'interactive' || document.readyState === 'complete') {
    initSettlyAssistantWidget();
  }
})();
