export interface MarketplaceListing {
  id: string;
  title: string;
  price: string;
  strikethrough_price?: string;
  location: {
    city: string;
    state: string;
  };
  url: string;
  delivery_types?: string[];
  is_sold?: boolean;
  is_pending?: boolean;
  category_id?: string;
  subtitle?: string;
  description?: string;
}

export interface SearchParams {
  query: string;
  location?: string;
  radius?: number;  // Search radius in kilometers
}

export interface SearchOptions {
  ajax_wait?: boolean;
  page_wait?: number;
  fetchDescriptions?: boolean;  // If true, fetches description from each item page (slower)
}
