'use client';

import React, { useState } from 'react';
import {
  LandingNav,
  HeroSection,
  IntegrationsStrip,
  FeatureBento,
  VoiceDemoSimulator,
  HowItWorks,
  WhatChanges,
  IntegrationsSection,
  ComplianceSection,
  PricingSection,
  FaqSection,
  CtaBanner,
  LandingFooter,
  EarlyAccessModal,
} from '@/components/landing';

export default function LandingPage() {
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);

  const openDemoModal = () => setIsDemoModalOpen(true);
  const closeDemoModal = () => setIsDemoModalOpen(false);

  return (
    <div className="min-h-screen bg-white dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 selection:bg-zinc-900 selection:text-white dark:selection:bg-zinc-100 dark:selection:text-zinc-950 flex flex-col w-full font-sans antialiased relative overflow-x-hidden transition-colors duration-200">
      {/* Subtle ambient light aura for high-end visual depth */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[360px] bg-zinc-400/[0.07] dark:bg-white/[0.03] blur-[120px] rounded-full"
      />

      <LandingNav onOpenDemoModal={openDemoModal} />
      <HeroSection onOpenDemoModal={openDemoModal} />
      <IntegrationsStrip />
      <FeatureBento />
      <VoiceDemoSimulator />
      <HowItWorks />
      <WhatChanges />
      <IntegrationsSection onOpenDemoModal={openDemoModal} />
      <ComplianceSection />
      <PricingSection onOpenDemoModal={openDemoModal} />
      <FaqSection />
      <CtaBanner onOpenDemoModal={openDemoModal} />
      <LandingFooter />

      <EarlyAccessModal
        isOpen={isDemoModalOpen}
        onClose={closeDemoModal}
      />
    </div>
  );
}
