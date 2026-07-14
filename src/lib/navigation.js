import { LayoutDashboard, UploadCloud, Library, Wand2 } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/cifra-carica', label: 'Cifra & Carica', icon: UploadCloud },
  { to: '/libreria', label: 'Libreria File', icon: Library },
  { to: '/strumenti', label: 'Strumenti One-Off', icon: Wand2 },
];
