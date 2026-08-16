-- Expand allowed department icon keys for broader business categories.
-- Existing icon values remain valid; unknown app keys still fall back in UI mappers.

alter table public.departments
  drop constraint if exists departments_icon_check;

alter table public.departments
  add constraint departments_icon_check
  check (
    icon in (
      'stethoscope',
      'heart',
      'tooth',
      'eye',
      'siren',
      'scan',
      'flask',
      'users',
      'file',
      'car',
      'scissors',
      'sparkles',
      'pill',
      'wrench',
      'smartphone',
      'laptop',
      'shirt',
      'coffee',
      'shopping_cart',
      'dumbbell',
      'camera',
      'printer',
      'briefcase',
      'plane',
      'home',
      'bike',
      'hammer',
      'utensils',
      'store',
      'book',
      'banknote',
      'bath',
      'droplets',
      'cpu',
      'footprints',
      'building',
      'gavel',
      'graduation',
      'luggage',
      'shield',
      'paintbrush',
      'spray',
      'scale'
    )
  );
