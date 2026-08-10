import { LogoutIcon, ArrowLeftIcon } from "@heroicons/react/outline";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import photo from "../assets/dinosaur.png";

export default function Header() {
  const [modal, setModal] = useState(false);
  const { currentUser } = useAuth();

  return (
    <>
      <nav className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200 dark:bg-gray-800 dark:border-gray-700">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {currentUser && (
              <Link
                to="/"
                className="text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 transition-colors duration-200"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
            )}

            <Link to="/chat" className="flex">
              <span className="self-center text-lg font-semibold whitespace-nowrap text-gray-900 dark:text-white">
                Chat App
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {currentUser && (
              <Link
                to="/chat"
                className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-1 transition-colors duration-200"
              >
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={photo}
                  alt="avatar"
                />
              </Link>
            )}
          </div>
        </div>
      </nav>
    </>
  );
}