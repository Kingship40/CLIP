import React from 'react';
import { LandingNavbar } from '../components/landing/LandingNavbar';
import { HeroSection } from '../components/landing/HeroSection';
import { WorkflowSection } from '../components/landing/WorkflowSection';
import { FeatureCards } from '../components/landing/FeatureCards';
import { RepurposeComparison } from '../components/landing/RepurposeComparison';
import { RatioShowcase } from '../components/landing/RatioShowcase';
import { ExampleClipGallery } from '../components/landing/ExampleClipGallery';
import { PricingSection } from '../components/landing/PricingSection';
import { FAQSection } from '../components/landing/FAQSection';
import { LandingFooter } from '../components/landing/LandingFooter';

export const LandingPage: React.FC = () => {
  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: 'var(--bg-page)',
        color: 'var(--text-primary)',
      }}
    >
      <LandingNavbar />
      <main className="flex-1">
        <HeroSection />
        <WorkflowSection />
        <FeatureCards />
        <RepurposeComparison />
        <RatioShowcase />
        <ExampleClipGallery />
        <PricingSection />
        <FAQSection />
      </main>
      <LandingFooter />
    </div>
  );
};
