type Product = {
  id: string
  title: string
  short_description: string | null
  price_cents: number | null
  currency: string | null
  cta_label: string | null
}

type Props = {
  business: {
    name: string
    description: string
    phone_commercial: string
    mobile_commercial?: string | null
    email_commercial: string

    address_street: string
    address_number: string
    address_neighborhood: string
    address_city: string
    address_state: string
    address_zip: string
    address_complement?: string | null

    map_url?: string | null
    social_links?: Record<string, string> | null
  }
  products?: Product[]
}

export default function PublicBusinessView({ business, products }: Props) {
  const phoneLink = `tel:${business.phone_commercial.replace(/\D/g, "")}`
  const emailLink = `mailto:${business.email_commercial}`

  const hasProducts = Array.isArray(products) && products.length > 0

  return (
    <div className="bg-base-100 text-base-content">
      {/* HEADER */}
      <header className="w-full">
        <div className="max-w-[1440px] mx-auto px-[120px]">
          <div className="navbar pt-5 pb-5">
            <div className="flex-1">
              <img
                src="/images/logo_mental_health.jpg"
                alt={`Logo ${business.name}`}
              />
            </div>
            <div className="flex-none">
              <ul className="menu menu-horizontal px-1">
                <li><a href="#quem-somos">Quem Somos</a></li>
                <li><a href="#produtos">Produtos e Serviços</a></li>
                <li><a href="#contato">Contato</a></li>
                <li><a href="#onde-fica">Onde estamos</a></li>
              </ul>
            </div>
          </div>
        </div>

        <div className="max-w-[1440px] mx-auto px-[120px] mt-20">
          <div className="hero">
            <div className="hero-content flex-col lg:flex-row-reverse gap-[80px] items-start">
              <img
                src="/images/image_hero.png"
                alt={business.name}
                width={480}
                height={480}
                className="rounded-xl shadow-2xl object-cover"
              />
              <div>
                <h1 className="text-5xl font-bold mb-6">{business.name}</h1>
                <p className="mb-6">{business.description}</p>
                <a href="#contato" className="btn btn-primary">
                  Quero agendar um atendimento
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* QUEM SOMOS */}
      <section id="quem-somos" className="py-[80px]">
        <div className="max-w-[1440px] mx-auto px-[120px] bg-[#f9fafb] p-20">
          <h2>Quem Somos</h2>
          <p className="mt-6">{business.description}</p>
        </div>
      </section>

      {/* PRODUTOS / SERVIÇOS */}
      <section id="produtos" className="py-[80px]">
        <div className="max-w-[1440px] mx-auto px-[120px]">
          <h2>Produtos e serviços</h2>

          {hasProducts ? (
            <div className="grid grid-cols-3 gap-8 mt-8">
              {products!.map((product) => (
                <div
                  key={product.id}
                  className="card bg-base-100 shadow-md border"
                >
                  <div className="card-body">
                    <h3 className="card-title">{product.title}</h3>

                    {product.short_description && (
                      <p className="text-sm text-gray-600">
                        {product.short_description}
                      </p>
                    )}

                    {product.price_cents !== null && (
                      <p className="mt-4 font-semibold">
                        {product.currency ?? 'BRL'}{' '}
                        {(product.price_cents / 100).toFixed(2)}
                      </p>
                    )}

                    <div className="card-actions justify-end mt-4">
                      <a href="#contato" className="btn btn-outline btn-sm">
                        {product.cta_label ?? 'Solicitar informações'}
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-gray-500">
              Entre em contato para conhecer nossos serviços.
            </p>
          )}
        </div>
      </section>

      {/* CONTATO */}
      <section id="contato" className="py-24 bg-[#f9fafb]">
        <div className="max-w-[1440px] mx-auto px-[120px] grid grid-cols-2 gap-8">
          <div>
            <h2>Fale conosco</h2>
            <p className="mt-2">Entre em contato:</p>
            <p className="mt-4">
              Telefone: <a href={phoneLink}>{business.phone_commercial}</a>
            </p>
            <p>
              Email: <a href={emailLink}>{business.email_commercial}</a>
            </p>
          </div>

          <div>
            <img
              src="/images/img_faleconosco.png"
              alt="Contato"
              className="rounded-xl"
            />
          </div>
        </div>
      </section>

      {/* MAPA */}
      {business.map_url && (
        <section id="onde-fica" className="pb-24 bg-[#f9fafb]">
          <div className="max-w-[1440px] mx-auto px-[120px]">
            <h3 className="text-3xl font-bold mb-8 pt-12">Onde fica</h3>
            <iframe
              src={business.map_url}
              width="100%"
              height="450"
              className="rounded-xl"
              loading="lazy"
            />
          </div>
        </section>
      )}

      {/* FOOTER */}
      <footer className="bg-[#F1F3F5] py-8">
        <div className="flex justify-center">
          <img
            src="/images/logo_atomicpage.png"
            alt="AtomicPage"
            className="w-40"
          />
        </div>
      </footer>
    </div>
  )
}
