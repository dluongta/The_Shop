import { useState } from "react";
import { SearchIcon, XIcon } from "@heroicons/react/solid";

export default function SearchUsers({ handleSearch }) {
  const [searchValue, setSearchValue] = useState("");

  const handleChange = (e) => {
    setSearchValue(e.target.value);
    handleSearch(e.target.value);
  };

  const handleClear = () => {
    setSearchValue("");
    handleSearch("");
  };

  return (
    <div className="mx-3 my-3">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
          <SearchIcon
            className="h-5 w-5 text-white"
            aria-hidden="true"
          />
        </div>
        <input
          id="search"
          name="search"
          className="block py-2 pl-10 pr-10 w-full bg-gray-50 text-gray-900 text-sm rounded-lg border border-gray-300 focus:outline-none focus:ring-sky-500 focus:border-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-sky-500 dark:focus:border-sky-500 [&::-webkit-search-cancel-button]:appearance-none"
          placeholder="Search"
          type="search"
          value={searchValue}
          onChange={handleChange}
        />
        
        {searchValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 pr-2 flex items-center focus:outline-none"
            aria-label="Clear search"
          >
            <XIcon
              className="h-5 w-5 text-white cursor-pointer"
              aria-hidden="true"
            />
          </button>
        )}
      </div>
    </div>
  );
}