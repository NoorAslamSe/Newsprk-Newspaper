interface JsonLdProps {
  data: Record<string, unknown>;
}

export default function JsonLd({ data }: JsonLdProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// Predefined schemas for comparison pages
export function ProductJsonLd({
  name,
  description,
  image,
  url,
  review,
}: {
  name: string;
  description: string;
  image: string;
  url: string;
  review?: { ratingValue: number; reviewCount: number };
}) {
  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image,
    url,
  };

  if (review) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: review.ratingValue,
      reviewCount: review.reviewCount,
    };
  }

  return <JsonLd data={schema} />;
}

export function ItemPageJsonLd({
  name,
  description,
  image,
  url,
  author,
  datePublished,
  dateModified,
}: {
  name: string;
  description: string;
  image: string;
  url: string;
  author: string;
  datePublished: string;
  dateModified: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "ItemPage",
        name,
        description,
        image,
        url,
        author: { "@type": "Person", name: author },
        datePublished,
        dateModified,
        publisher: {
          "@type": "Organization",
          name: "TrendsPosts",
          url: "https://trendsposts.com",
        },
      }}
    />
  );
}

export function FAQPageJsonLd({
  questions,
}: {
  questions: { question: string; answer: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: questions.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: q.answer,
          },
        })),
      }}
    />
  );
}

export function BreadcrumbJsonLd({
  items,
}: {
  items: { name: string; url: string }[];
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: item.name,
          item: item.url,
        })),
      }}
    />
  );
}
