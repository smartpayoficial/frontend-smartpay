import { useState, useRef, useEffect } from 'react';

export default function DropdownButton() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef();

  const toggleDropdown = () => setIsOpen(!isOpen);

  const handleOptionClick = (option) => {
    console.log(`Descargando para ${option}`);
    // Aquí puedes hacer una redirección o descarga:
    // window.location.href = `/download/${option.toLowerCase()}`;
    setIsOpen(false);
  };

  // Cierra el dropdown si haces clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div className="flex">
        <button
          type="button"
          onClick={toggleDropdown}
          className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Download
          <svg
            className="w-4 h-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.584l3.71-4.354a.75.75 0 111.14.976l-4.25 5a.75.75 0 01-1.14 0l-4.25-5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-10">
          <div
            onClick={() => handleOptionClick('Windows')}
            className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
          >
            Windows
          </div>
          <div
            onClick={() => handleOptionClick('Linux')}
            className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
          >
            Linux
          </div>
          <div
            onClick={() => handleOptionClick('Mac')}
            className="px-4 py-2 text-gray-800 hover:bg-gray-100 cursor-pointer"
          >
            Mac
          </div>
        </div>
      )}
    </div>
  );
}