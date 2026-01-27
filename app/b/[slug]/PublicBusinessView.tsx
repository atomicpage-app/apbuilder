type PublicBusinessDTO = {
  name: string;
  description: string;
  phone_commercial?: string | null;
  mobile_commercial?: string | null;
  email_commercial?: string;
  address_street?: string;
  address_number?: string;
  address_neighborhood?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_complement?: string | null;
  map_url?: string | null;
  social_links?: Record<string, string> | null;
};

type Product = {
  id: string;
  type: 'service' | 'product' | 'package';
  title: string;
  short_description: string | null;
  price_cents: number | null;
  currency: string | null;
  cta_label: string | null;
  image_url: string | null;
  position: number;
};

type Props = {
  business: PublicBusinessDTO;
  products?: Product[];
};

export default function PublicBusinessView({ business, products }: Props) {
  return (
    <div>
      <h1>{business.name}</h1>
      <p>{business.description}</p>

      {products && products.length > 0 && (
        <ul>
          {products.map((p) => (
            <li key={p.id}>{p.title}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
