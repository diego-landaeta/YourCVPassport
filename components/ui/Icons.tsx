// Re-export Heroicons para compatibilidad con plantillas NUEVOS
import React from 'react';
import {
  EnvelopeIcon,
  PhoneIcon,
  MapPinIcon,
  GlobeAltIcon,
  BriefcaseIcon,
  AcademicCapIcon,
  WrenchScrewdriverIcon,
  CalendarIcon,
  LinkIcon,
  ArrowTopRightOnSquareIcon,
  ShieldCheckIcon,
  QrCodeIcon,
  CodeBracketIcon,
  RectangleGroupIcon,
} from '@heroicons/react/24/outline';
import { GlobeAltIcon as GlobeIcon } from '@heroicons/react/24/outline';

// Icons que las plantillas NUEVOS esperan
export const Mail = EnvelopeIcon;
export const Phone = PhoneIcon;
export const MapPin = MapPinIcon;
export const Globe = GlobeAltIcon;
export const Briefcase = BriefcaseIcon;
export const GraduationCap = AcademicCapIcon;
export const Wrench = WrenchScrewdriverIcon;
export const Calendar = CalendarIcon;
export const Link = LinkIcon;
export const ExternalLink = ArrowTopRightOnSquareIcon;
export const ShieldCheck = ShieldCheckIcon;
export const QrCode = QrCodeIcon;
export const Code = CodeBracketIcon;
export const LayoutTemplate = RectangleGroupIcon;
export const Github = GlobeIcon; // Using Globe as fallback for Github

// También exportar por defecto algunos iconos comunes
export default {
  Mail,
  Phone,
  MapPin,
  Globe,
  Briefcase,
  GraduationCap,
  Wrench,
  Calendar,
  Link,
  ExternalLink,
  ShieldCheck,
  QrCode,
  Code,
  LayoutTemplate,
  Github,
};
