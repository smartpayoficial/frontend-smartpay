import { Bars3Icon, ComputerDesktopIcon, WindowIcon} from '@heroicons/react/24/outline';

function PlatformDropdown({ text, onPlatformSelect }) {

    return (
        <div className="relative inline-block text-left group">

            <button
                type="button"
                className="inline-flex justify-center items-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-100 focus:ring-indigo-500"
            >
                <Bars3Icon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                {text}
            </button>

            {/* Menú Desplegable (Content) */}
            <div
                className="hidden group-hover:block origin-top-right absolute right-0 mt-0.5 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10"
                role="menu"
                aria-orientation="vertical"
            >
                <div className="py-1" role="none">
                    {/* Opción Windows */}
                    <button
                        // Llama a la prop onPlatformSelect y pasa 'Windows'
                        onClick={() => onPlatformSelect('Windows')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-left"
                        role="menuitem"
                    >
                        <WindowIcon className="h-5 w-5 mr-2 text-blue-500"/>
                        Windows
                    </button>

                    {/* Opción Linux */}
                    <button
                        // Llama a la prop onPlatformSelect y pasa 'Linux'
                        onClick={() => onPlatformSelect('Linux')}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 text-left"
                        role="menuitem"
                    >
                        <ComputerDesktopIcon className="h-5 w-5 mr-2 text-gray-700"/>
                        Linux
                    </button>
                </div>
            </div>
        </div>
    );
}

export default PlatformDropdown;