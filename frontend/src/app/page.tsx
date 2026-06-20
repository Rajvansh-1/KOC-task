'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/useAuthStore';
import { ArrowRight, Trophy, Swords, Crown } from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  return (
    <div className="flex flex-col items-center min-h-screen bg-background">
      {/* Hero Section */}
      <section className="w-full bg-[#FEF1E6] py-16 md:py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-8 max-w-7xl flex flex-col md:flex-row items-center">
          <div className="md:w-3/5 z-10">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-[#222222] leading-tight mb-4">
              Best Online Chess Classes <br className="hidden lg:block"/>
              for Kids with FIDE-Rated Coaches
            </h1>
            <p className="text-lg md:text-xl font-bold text-[#222222] mb-6">
              A Trusted Online Chess Academy for Young Minds in 30+ Countries
            </p>
            
            <ul className="space-y-3 mb-10 text-[#333333]">
              <li className="flex items-start">
                <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-[#222222] flex-shrink-0"></span>
                <span><strong>Personal Chess Coaching</strong> from FIDE-rated tutors and Grandmasters</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-[#222222] flex-shrink-0"></span>
                <span><strong>Weekly Masterclass</strong> with <strong>Top Grandmasters</strong>.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-[#222222] flex-shrink-0"></span>
                <span>Structured Online <strong>Chess Lessons for ages 4 to 15</strong></span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-[#222222] flex-shrink-0"></span>
                <span><strong>1 on 1 and group Chess Classes</strong> for Beginners and advanced players</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2 mt-1.5 h-1.5 w-1.5 rounded-full bg-[#222222] flex-shrink-0"></span>
                <span>Recognised and <strong>Awarded by Government of India</strong></span>
              </li>
            </ul>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/programs">
                <Button className="bg-[#05416F] hover:bg-[#032E50] text-white rounded-md px-8 py-6 text-[15px] font-bold shadow-lg w-full sm:w-auto transition-transform hover:scale-105 border-0">
                  View Our Courses
                </Button>
              </Link>
              {!isLoading && isAuthenticated ? (
                <Link href="/tournaments">
                  <Button className="bg-[#F37021] hover:bg-[#E0631B] text-white rounded-md px-8 py-6 text-[15px] font-bold shadow-lg shadow-[#F37021]/30 w-full sm:w-auto transition-transform hover:scale-105 border-0">
                    Enter Arena
                  </Button>
                </Link>
              ) : (
                <Link href="/register">
                  <Button className="bg-[#F37021] hover:bg-[#E0631B] text-white rounded-md px-8 py-6 text-[15px] font-bold shadow-lg shadow-[#F37021]/30 w-full sm:w-auto transition-transform hover:scale-105 border-0">
                    Book a FREE Trial Class
                  </Button>
                </Link>
              )}
            </div>
          </div>
          
          {/* Right side illustration abstract */}
          <div className="md:w-2/5 mt-12 md:mt-0 relative flex justify-center z-0">
             <div className="w-72 h-72 rounded-full bg-[#F37021]/10 absolute -top-10 -right-10 blur-3xl"></div>
             <div className="w-80 h-80 rounded-full bg-[#05416F]/10 absolute top-20 right-10 blur-3xl"></div>
             <div className="relative glass p-8 rounded-3xl w-full max-w-sm aspect-square flex items-center justify-center border-4 border-white transform rotate-3 shadow-2xl">
                <Crown className="w-32 h-32 text-[#F37021]" />
             </div>
          </div>
        </div>
      </section>

      {/* Parent's Corner Section */}
      <section className="w-full bg-[#FEF1E6] py-16">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-[#222222] mb-4 sm:mb-0">
              Parent's Corner
            </h2>
            <Button className="bg-[#F37021] hover:bg-[#E0631B] text-white rounded-full px-6 py-2 shadow-md border-0 font-bold">
              View all blogs
            </Button>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg transition-transform hover:-translate-y-2 cursor-pointer border border-gray-100 flex flex-col h-full">
              <div className="h-48 bg-gray-100 relative flex items-center justify-center p-6 border-b border-gray-100">
                <span className="text-5xl font-black text-[#05416F] tracking-tighter">U <span className="text-[#F37021]">VS</span> KA</span>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <p className="text-[#F37021] text-sm font-bold mb-2">KOC</p>
                <h3 className="text-xl font-bold text-[#222222] mb-3 leading-tight">
                  Kingdom of Chess vs Kaabil Kids vs Upstep Academy
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  Choosing an online chess academy for your child has never been easier when you know what to look for...
                </p>
                <div className="mt-auto">
                  <span className="text-[#F37021] text-sm font-bold">read more</span>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg transition-transform hover:-translate-y-2 cursor-pointer border border-gray-100 flex flex-col h-full">
              <div className="h-48 bg-gray-100 relative flex items-center justify-center p-6 border-b border-gray-100">
                <span className="text-5xl font-black text-[#05416F] tracking-tighter">DOM <span className="text-[#F37021]">VS</span> C</span>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <p className="text-[#F37021] text-sm font-bold mb-2">KOC</p>
                <h3 className="text-xl font-bold text-[#222222] mb-3 leading-tight">
                  Kingdom of Chess vs ChessBrainz: Which is Best For Your Child
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  When you search for Kingdom of Chess vs ChessBrainz, you need a detailed breakdown of which platform offers better coaching...
                </p>
                <div className="mt-auto">
                  <span className="text-[#F37021] text-sm font-bold">read more</span>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-white rounded-2xl overflow-hidden shadow-lg transition-transform hover:-translate-y-2 cursor-pointer border border-gray-100 flex flex-col h-full">
              <div className="h-48 bg-gray-100 relative flex items-center justify-center p-6 border-b border-gray-100">
                <span className="text-5xl font-black text-[#F37021] tracking-tighter">HESS</span>
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <p className="text-[#F37021] text-sm font-bold mb-2">KOC</p>
                <h3 className="text-xl font-bold text-[#222222] mb-3 leading-tight">
                  Benefits of Chess: 11 Science-Backed Reasons Every Child Should Play
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  People always assume chess is for a certain type of person, but the cognitive benefits are universal...
                </p>
                <div className="mt-auto">
                  <span className="text-[#F37021] text-sm font-bold">read more</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-[#EBEFF2] pt-16 pb-8 border-t border-gray-200">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="grid md:grid-cols-3 gap-12 mb-12">
            
            <div>
              <h4 className="text-lg font-bold text-[#222222] mb-6">Contact Us</h4>
              <ul className="space-y-4 text-sm text-[#444444]">
                <li className="flex items-start">
                  <span className="font-bold mr-2 mt-0.5">•</span>
                  <span>Kingdom of Chess, near Srinath Hospital, Navratna Complex, Pulla Bhuwana, Mahaveer Colony Park, Udaipur, Rajasthan 313001</span>
                </li>
                <li className="flex items-start">
                  <span className="font-bold mr-2 mt-0.5">•</span>
                  <span>1401 Pennsylvania Ave Suite 105 Wilmington, DE 19806 United States</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-lg font-bold text-[#222222] mb-6">Useful Links</h4>
              <ul className="space-y-3 text-sm text-[#E24A58] font-medium">
                <li><Link href="#" className="hover:text-primary transition-colors">Career</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Blogs</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Success Stories</Link></li>
                <li><Link href="/tournaments" className="hover:text-primary transition-colors">Our Tournaments</Link></li>
              </ul>
            </div>

            <div className="flex flex-col items-start md:items-end text-left md:text-right">
              <img src="/complete-logo.webp" alt="Kingdom of Chess Complete Logo" className="h-16 w-auto object-contain mb-4" />
              <p className="text-sm text-gray-600 italic max-w-xs">
                Recognized by DPIIT – Startup India, Government of India.
              </p>
            </div>
          </div>
          
          <div className="border-t border-gray-300 pt-8 text-center text-sm text-gray-500">
            © {new Date().getFullYear()} Kingdom of Chess. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
