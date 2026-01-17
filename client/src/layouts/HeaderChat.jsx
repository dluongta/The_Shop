import { LogoutIcon, ArrowLeftIcon } from "@heroicons/react/outline";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../contexts/AuthContext";
import Logout from "../Logout";
import ThemeToggler from "./ThemeToggler";
import photo from "../assets/dinosaur.png";

export default function Header() {
  const [modal, setModal] = useState(false);
  const { currentUser } = useAuth();

  return (
    <>
      <nav className="px-2 sm:px-4 py-2.5 bg-gray-50 border-gray-200 dark:bg-gray-800 dark:border-gray-700 text-gray-900 text-sm rounded border dark:text-white">
        <div className="container mx-auto flex items-center justify-between">

          {/* Left side: Back + Logo */}
          <div className="flex items-center space-x-2">
            {currentUser && (
              <Link
                to="/"
                className="text-gray-500 dark:text-gray-400
                           hover:bg-gray-100 dark:hover:bg-gray-700
                           rounded-full p-2"
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

          {/* Right side: Avatar */}
          <div className="flex">
            {currentUser && (
              <Link
                to="/chat"
                className="text-gray-500 dark:text-gray-400
                           hover:bg-gray-100 dark:hover:bg-gray-700
                           rounded-full p-1"
              >
                <img
                  className="h-8 w-8 rounded-full"
                  src={photo}
                  alt="avatar"
                />
              </Link>
            )}
          </div>

        </div>
      </nav>

      {/* Logout modal */}
      {/* {modal && <Logout modal={modal} setModal={setModal} />} */}
    </>
  );
}
