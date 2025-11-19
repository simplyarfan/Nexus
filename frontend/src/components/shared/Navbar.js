import Link from 'next/link';

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-xl bg-card/80 border-b border-white/20">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center space-x-2 cursor-pointer hover:scale-105 transition-transform duration-300">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-600 to-red-600 rounded-lg flex items-center justify-center">
              <div className="w-4 h-4 bg-card rounded-sm transform rotate-45"></div>
            </div>
            <span className="text-xl font-bold text-foreground">Nexus</span>
          </div>
        </Link>

        <div className="hidden md:flex space-x-8 text-sm font-medium">
          <Link
            href="/features"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Features
          </Link>
          <Link
            href="/about"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            About
          </Link>
          <Link
            href="/contact"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Contact
          </Link>
        </div>

        <Link href="/auth/login">
          <button className="px-6 py-2.5 bg-gradient-to-r from-orange-600 to-red-600 text-white text-sm font-medium rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300">
            Get Started
          </button>
        </Link>
      </div>
    </nav>
  );
}
