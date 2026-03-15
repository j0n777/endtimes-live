import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOHeadProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: string;
    schema?: any; // Dynamic JSON-LD schema
}

export const SEOHead: React.FC<SEOHeadProps> = (props) => {
    const {
        title = 'End Times Monitor | Global Intelligence Platform',
        description = 'Real-time global conflict tracking, OSINT aggregation, prophetic timeline analysis, and situational awareness map. The ultimate source for end times intelligence.',
        image = 'https://endtimes.live/logo_etm.jpg',
        url = 'https://endtimes.live',
        type = 'website',
        schema
    } = props;
    const siteTitle = title === 'End Times Monitor | Global Intelligence Platform' ? title : title + ' | End Times Monitor';

    return (
        <Helmet>
            {/* Primary Meta Tags */}
            <title>{siteTitle}</title>
            <meta name="title" content={siteTitle} />
            <meta name="description" content={description} />
            <meta name="keywords" content="End Times, World War 3, Prophecy, Israel, Ukraine, Iran, Global Conflict, OSINT, Live Map, Intel Feed, Apocalypse, Survival" />
            <meta name="author" content="End Times Monitor" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />

            {/* Open Graph / Facebook */}
            <meta property="og:type" content={type} />
            <meta property="og:url" content={url} />
            <meta property="og:title" content={siteTitle} />
            <meta property="og:description" content={description} />
            <meta property="og:image" content={image} />
            <meta property="og:site_name" content="End Times Monitor" />

            {/* Twitter */}
            <meta property="twitter:card" content="summary_large_image" />
            <meta property="twitter:url" content={url} />
            <meta property="twitter:title" content={siteTitle} />
            <meta property="twitter:description" content={description} />
            <meta property="twitter:image" content={image} />

            {/* Canonical */}
            <link rel="canonical" href={url} />

            {/* Geo-tagging for "World" relevance */}
            <meta name="geo.region" content="US" />
            <meta name="geo.position" content="31.7683;35.2137" /> {/* Jerusalem coordinates as symbolic center */}
            <meta name="ICBM" content="31.7683, 35.2137" />

            {/* Structured Data (JSON-LD) for AI & Search Engines */}
            <script type="application/ld+json">
                {schema ? JSON.stringify(schema) : JSON.stringify({
                    "@context": "https://schema.org",
                    "@graph": [
                        {
                            "@type": "WebApplication",
                            "name": "End Times Monitor",
                            "url": "https://endtimes.live",
                            "applicationCategory": "NewsApplication",
                            "operatingSystem": "All",
                            "description": "Real-time global intelligence platform monitoring geopolitical conflicts, seismic activity, and prophetic indicators.",
                            "offers": {
                                "@type": "Offer",
                                "price": "0",
                                "priceCurrency": "USD"
                            }
                        },
                        {
                            "@type": "NewsMediaOrganization",
                            "name": "End Times Monitor",
                            "url": "https://endtimes.live",
                            "logo": {
                                "@type": "ImageObject",
                                "url": "https://endtimes.live/logo_etm.jpg"
                            },
                            "sameAs": [
                                "https://twitter.com/endtimesmonitor",
                                "https://t.me/endtimesmonitor"
                            ]
                        }
                    ]
                })}
            </script>
        </Helmet>
    );
};
