import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '../common/Button';

export const PricingSection: React.FC = () => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const plans = [
    {
      name: 'Starter',
      priceMonthly: 0,
      priceAnnual: 0,
      period: 'Forever free',
      description: 'Ideal for trying out AI highlight extraction and testing client workflows.',
      features: [
        '3 video projects per month',
        'Up to 15-minute video duration',
        'Auto 9:16 vertical crop',
        'Standard animated captions',
        'SubRip (.SRT) exports',
        '1080p resolution',
      ],
      cta: 'Start Free',
      popular: false,
      variant: 'secondary' as const,
    },
    {
      name: 'Pro Creator',
      priceMonthly: 29,
      priceAnnual: 24,
      period: 'per month',
      description: 'Built for active YouTubers, podcasters, and solo media creators.',
      features: [
        'Unlimited video projects',
        'Up to 2-hour video uploads',
        'All kinetic caption presets (Hormozi, Karaoke, Neon)',
        'Custom keyword highlight colors',
        'AI viral score ranking',
        'Priority queue processing',
        'Batch .SRT & metadata downloads',
      ],
      cta: 'Get Started with Pro',
      popular: true,
      variant: 'primary' as const,
    },
    {
      name: 'Agency & Scale',
      priceMonthly: 79,
      priceAnnual: 65,
      period: 'per month',
      description: 'For content agencies, editors, and podcast production companies.',
      features: [
        'Everything in Pro Creator',
        'Up to 4-hour 4K uploads',
        'Custom brand caption presets',
        'Multi-user team workspace',
        'REST API & Webhook integration',
        'Dedicated customer support',
      ],
      cta: 'Contact Sales',
      popular: false,
      variant: 'secondary' as const,
    },
  ];

  return (
    <section id="pricing" className="py-20 md:py-28 bg-dark-900/30 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-400">
            Simple & Transparent
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-2 mb-4 tracking-tight">
            Plans for Creators at Every Stage
          </h2>
          <p className="text-slate-400 text-sm sm:text-base">
            Start free without a credit card. Upgrade whenever you need higher upload capacities.
          </p>

          {/* Monthly / Annual Toggle */}
          <div className="mt-6 inline-flex items-center p-1 bg-dark-950 border border-slate-800 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-lg transition-colors ${
                billingCycle === 'monthly' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                billingCycle === 'annual' ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Annual Billing</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.2 rounded font-bold">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, i) => {
            const price = billingCycle === 'annual' ? plan.priceAnnual : plan.priceMonthly;

            return (
              <div
                key={i}
                className={`rounded-2xl p-6 sm:p-8 flex flex-col justify-between transition-all relative ${
                  plan.popular
                    ? 'bg-gradient-to-b from-brand-950/70 to-dark-900 border-2 border-brand-500 shadow-glow-brand'
                    : 'bg-dark-900 border border-slate-800'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>Most Popular</span>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-white">{plan.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 min-h-[32px]">{plan.description}</p>

                  <div className="my-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-white font-mono">
                        ${price}
                      </span>
                      <span className="text-xs text-slate-400">/{plan.period}</span>
                    </div>
                  </div>

                  <ul className="space-y-3 text-xs text-slate-300 mb-8 border-t border-slate-800/80 pt-6">
                    {plan.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2.5">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link to="/signup" className="w-full">
                  <Button variant={plan.variant} size="md" className="w-full">
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
