'use client';

import { useEffect, useState } from 'react';

import { Home } from '../src/views/Home.jsx';

export default function HomeRouteClient() {
  const [heroSlides, setHeroSlides] = useState([]);
  const [blogs, setBlogs] = useState([]);

  useEffect(() => {
    let isActive = true;

    async function loadHomeData() {
      try {
        const { fetchHeroData, fetchSupabaseBlogPosts } = await import('../src/productData.js');
        const [nextHeroSlides, nextBlogs] = await Promise.all([
          fetchHeroData(),
          fetchSupabaseBlogPosts(),
        ]);

        if (isActive) {
          setHeroSlides(nextHeroSlides || []);
          setBlogs(nextBlogs || []);
        }
      } catch (err) {
        console.error('Unable to load home page data:', err);
      }
    }

    void loadHomeData();
    return () => {
      isActive = false;
    };
  }, []);

  return <Home heroSlides={heroSlides} blogs={blogs} />;
}
