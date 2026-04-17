export function Footer() {
  return (
    <div className="py-8 px-4 font-sans">
      <footer className="max-w-7xl mx-auto bg-[#1a1a1a]/80 border border-white/5 backdrop-blur-md rounded-[2rem] pt-16 pb-8 px-12 text-white">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-16">
          
          {/* Brand */}
          <div className="col-span-1 md:col-span-5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="flex">
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" fill="#8b5cf6"/>
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" stroke="#a855f7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="font-semibold text-2xl tracking-tight">Wilshire</span>
              </div>
              <p className="text-sm text-gray-400 mb-8 max-w-sm leading-relaxed">
                Wilshire CRM Dashboard stands as a robust and user-friendly platform designed to revolutionize customer relationship management for businesses of all sizes.
              </p>
            </div>
            <a href="mailto:hello.wilshire@gmail.com" className="text-white text-2xl font-medium tracking-wide">
              hello.wilshire@gmail.com
            </a>
          </div>

          {/* Links */}
          <div className="col-span-1 md:col-span-2 md:col-start-7">
            <h4 className="text-white mb-6 text-base tracking-wide">Home</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Our Services</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Benefit</a></li>
            </ul>
          </div>

          {/* Platform */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-white mb-6 text-base tracking-wide">Platform</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Discord</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Classroom</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Zoom</a></li>
            </ul>
          </div>

          {/* Social Media */}
          <div className="col-span-1 md:col-span-2">
            <h4 className="text-white mb-6 text-base tracking-wide">Sosial Media</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Instagram</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Twitter</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Facebook</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Linkedin</a></li>
            </ul>
          </div>

        </div>

        <div className="pt-12 text-sm text-gray-400">
          <p>Copyright &copy; Kama. All rights reserved</p>
        </div>
      </footer>
    </div>
  );
}
