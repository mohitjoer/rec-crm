'use client';

import React, { useState } from 'react';
import { CheckCircle2, Send, Building2, Mail, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';

export interface EarlyAccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EarlyAccessModal({ isOpen, onClose }: EarlyAccessModalProps) {
  const [submitted, setSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    useCase: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent onClose={onClose}>
        {submitted ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-white text-zinc-950 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-zinc-950" />
            </div>
            <h3 className="text-xl font-bold text-white">We&apos;ll be in touch shortly</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
              Thanks for reaching out. Our team will review your requirements and follow up promptly to schedule your demo.
            </p>
            <div className="pt-4">
              <Button variant="secondary" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                Schedule A Demo
              </span>
              <h3 className="text-xl font-bold text-white mt-2">Book a product demo</h3>
              <p className="text-xs text-zinc-400 mt-1">
                Tell us a bit about your current collections workflow and we&apos;ll walk you through how Recovra fits in.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <label htmlFor="user-name" className="block text-xs font-medium text-zinc-300 mb-1">Your Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <Input
                    id="user-name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Jane Doe"
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="user-email" className="block text-xs font-medium text-zinc-300 mb-1">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <Input
                    id="user-email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="jane@company.com"
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="user-company" className="block text-xs font-medium text-zinc-300 mb-1">Company or Platform</label>
                <div className="relative">
                  <Building2 className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <Input
                    id="user-company"
                    type="text"
                    required
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    placeholder="Acme SaaS / NBFC"
                    className="pl-9 text-xs"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="user-bottleneck" className="block text-xs font-medium text-zinc-300 mb-1">What is your biggest collections bottleneck?</label>
                <textarea
                  id="user-bottleneck"
                  aria-label="What is your biggest collections bottleneck?"
                  rows={3}
                  value={formData.useCase}
                  onChange={(e) => setFormData({ ...formData, useCase: e.target.value })}
                  placeholder="e.g. Manual invoice follow-up emails, EMI bounce outreach, tracking promises-to-pay..."
                  className="w-full p-3 rounded-xl bg-[#141416] border border-[#242428] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="default" className="gap-1.5 font-bold">
                <Send className="w-3.5 h-3.5" />
                <span>Submit Request</span>
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
