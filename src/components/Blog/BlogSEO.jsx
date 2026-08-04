import { useEffect } from 'react'

const SITE_URL = 'https://ishubhamrathi.dev'
const SITE_NAME = 'Shubham Rathi'

function setMeta(name, content, attr = 'name') {
  let tag = document.querySelector(`meta[${attr}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function removeMeta(name, attr = 'name') {
  document.querySelector(`meta[${attr}="${name}"]`)?.remove()
}

function stripTags(html) {
  return (html || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export default function BlogSEO({ post }) {
  useEffect(() => {
    if (!post) return

    const title = `${post.title} | Blog | ${SITE_NAME}`
    const description = post.excerpt || stripTags(post.content) || ''
    const url = `${SITE_URL}/blogs/${post.slug}`
    const image = post.image || `${SITE_URL}/logo192.png`

    const originalTitle = document.title
    const originalDesc = document.querySelector('meta[name="description"]')
    const originalDescContent = originalDesc?.getAttribute('content')

    document.title = title
    if (description) setMeta('description', description)
    setMeta('og:title', title, 'property')
    setMeta('og:description', description, 'property')
    setMeta('og:url', url, 'property')
    setMeta('og:type', 'article', 'property')
    setMeta('og:image', image, 'property')
    setMeta('og:site_name', SITE_NAME, 'property')
    setMeta('twitter:card', 'summary_large_image')
    setMeta('twitter:title', title)
    setMeta('twitter:description', description)
    setMeta('twitter:image', image)

    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    canonical.setAttribute('href', url)

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: post.title,
      description,
      author: { '@type': 'Person', name: post.author || SITE_NAME },
      datePublished: post.publishedAt || undefined,
      dateModified: post.publishedAt || undefined,
      image,
      url,
      publisher: {
        '@type': 'Organization',
        name: SITE_NAME,
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/logo192.png` },
      },
    }
    let script = document.getElementById('blog-json-ld')
    if (!script) {
      script = document.createElement('script')
      script.id = 'blog-json-ld'
      script.setAttribute('type', 'application/ld+json')
      document.head.appendChild(script)
    }
    script.textContent = JSON.stringify(jsonLd)

    return () => {
      document.title = originalTitle
      if (originalDescContent !== null && originalDescContent !== undefined) {
        setMeta('description', originalDescContent)
      }
      removeMeta('og:title', 'property')
      removeMeta('og:description', 'property')
      removeMeta('og:url', 'property')
      removeMeta('og:type', 'property')
      removeMeta('og:image', 'property')
      removeMeta('og:site_name', 'property')
      removeMeta('twitter:card')
      removeMeta('twitter:title')
      removeMeta('twitter:description')
      removeMeta('twitter:image')
      canonical?.remove()
      script?.remove()
    }
  }, [post])

  return null
}
