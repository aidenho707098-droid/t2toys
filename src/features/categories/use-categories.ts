import { useEffect, useState } from 'react';

import { supabase } from '@/lib/supabase';

export type Category = {
  id: number;
  parent_id: number | null;
  slug: string;
  name_zh: string;
  name_en: string;
  icon: string | null;
  sensitive: boolean;
  requires_compliance: boolean;
  sort: number;
};

/** Top-level categories in display order. */
export function useTopCategories() {
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    supabase
      .from('categories')
      .select('id,parent_id,slug,name_zh,name_en,icon,sensitive,requires_compliance,sort')
      .is('parent_id', null)
      .order('sort')
      .returns<Category[]>()
      .then(({ data, error: err }) => {
        if (cancelled) return;
        if (err) setError(err.message);
        else setCategories(data ?? []);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { categories: categories ?? [], loading: supabase !== null && categories === null && !error, error };
}

export function categoryName(c: Pick<Category, 'name_zh' | 'name_en'>, language: string) {
  return language === 'en' ? c.name_en : c.name_zh;
}
