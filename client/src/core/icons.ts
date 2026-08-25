import { Users, ShoppingCart, Package, type LucideIcon } from 'lucide-react';

// Keyed by the `icon` string each server ModuleDefinition declares.
const ICONS: Record<string, LucideIcon> = {
  users: Users,
  'shopping-cart': ShoppingCart,
  package: Package,
};

export function getModuleIcon(name: string): LucideIcon {
  return ICONS[name] ?? Package;
}
