import type { LucideIcon } from 'lucide-react-native';
import {
  Banknote,
  Bath,
  Bike,
  BookOpen,
  Briefcase,
  Building2,
  Camera,
  Car,
  CircleDot,
  Coffee,
  Cpu,
  Droplets,
  Dumbbell,
  Eye,
  FileText,
  FlaskConical,
  Footprints,
  Gavel,
  GraduationCap,
  Hammer,
  HeartPulse,
  Home,
  Laptop,
  Luggage,
  Paintbrush,
  Pill,
  Plane,
  Printer,
  Scale,
  ScanLine,
  Scissors,
  Shield,
  Shirt,
  ShoppingCart,
  Siren,
  Smartphone,
  Sparkles,
  SprayCan,
  Stethoscope,
  Store,
  Users,
  UtensilsCrossed,
  Wrench,
} from 'lucide-react-native';

import {
  DEPARTMENT_ICON_IDS,
  type DepartmentIcon,
} from '@/domain/models/department';

/** Human labels for the department icon picker. */
export const DEPARTMENT_ICON_LABELS: Record<DepartmentIcon, string> = {
  stethoscope: 'Clinic',
  heart: 'Heart',
  tooth: 'Dental',
  eye: 'Eye',
  siren: 'Emergency',
  scan: 'Scan',
  flask: 'Lab',
  users: 'General',
  file: 'Docs',
  car: 'Auto',
  scissors: 'Barber',
  sparkles: 'Beauty',
  pill: 'Pharmacy',
  wrench: 'Repair',
  smartphone: 'Mobile',
  laptop: 'Computer',
  shirt: 'Clothing',
  coffee: 'Cafe',
  shopping_cart: 'Grocery',
  dumbbell: 'Fitness',
  camera: 'Photo',
  printer: 'Print',
  briefcase: 'Office',
  plane: 'Travel',
  home: 'Home',
  bike: 'Bike',
  hammer: 'Hardware',
  utensils: 'Restaurant',
  store: 'Shop',
  book: 'Education',
  banknote: 'Finance',
  bath: 'Spa',
  droplets: 'Car Wash',
  cpu: 'Electronics',
  footprints: 'Shoes',
  building: 'Services',
  gavel: 'Legal',
  graduation: 'Tutoring',
  luggage: 'Travel Desk',
  shield: 'Security',
  paintbrush: 'Design',
  spray: 'Cleaning',
  scale: 'Legal Scale',
};

const DEPARTMENT_ICON_COMPONENTS: Record<DepartmentIcon, LucideIcon> = {
  stethoscope: Stethoscope,
  heart: HeartPulse,
  tooth: CircleDot,
  eye: Eye,
  siren: Siren,
  scan: ScanLine,
  flask: FlaskConical,
  users: Users,
  file: FileText,
  car: Car,
  scissors: Scissors,
  sparkles: Sparkles,
  pill: Pill,
  wrench: Wrench,
  smartphone: Smartphone,
  laptop: Laptop,
  shirt: Shirt,
  coffee: Coffee,
  shopping_cart: ShoppingCart,
  dumbbell: Dumbbell,
  camera: Camera,
  printer: Printer,
  briefcase: Briefcase,
  plane: Plane,
  home: Home,
  bike: Bike,
  hammer: Hammer,
  utensils: UtensilsCrossed,
  store: Store,
  book: BookOpen,
  banknote: Banknote,
  bath: Bath,
  droplets: Droplets,
  cpu: Cpu,
  footprints: Footprints,
  building: Building2,
  gavel: Gavel,
  graduation: GraduationCap,
  luggage: Luggage,
  shield: Shield,
  paintbrush: Paintbrush,
  spray: SprayCan,
  scale: Scale,
};

const DEFAULT_ICON: DepartmentIcon = 'users';

export function isDepartmentIcon(
  value: string | null | undefined,
): value is DepartmentIcon {
  return Boolean(
    value && (DEPARTMENT_ICON_IDS as readonly string[]).includes(value),
  );
}

export function normalizeDepartmentIconKey(
  value: string | null | undefined,
): DepartmentIcon {
  return isDepartmentIcon(value) ? value : DEFAULT_ICON;
}

/** Resolve Lucide icon for a department icon key (safe default for unknown). */
export function getDepartmentIconComponent(
  icon: string | null | undefined,
): LucideIcon {
  const key = normalizeDepartmentIconKey(icon);
  return DEPARTMENT_ICON_COMPONENTS[key] ?? Users;
}

export { DEPARTMENT_ICON_IDS };
