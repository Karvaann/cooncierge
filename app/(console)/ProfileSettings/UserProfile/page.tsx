"use client";
import React, { useState } from "react";
import { MdOutlineAddAPhoto } from "react-icons/md";
import { useRouter } from "next/navigation";
// import { CircularProgressbar, buildStyles } from "react-circular-progressbar";
// import "react-circular-progressbar/dist/styles.css";

interface UserProfileProps {}

const UserProfile: React.FC<UserProfileProps> = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    countryCode: "",
    phone: "",
    email: "",
    designation: "",
    gender: "",
    dob: "",
    emergencyContact: "",
  });
  const router = useRouter();
  // const [progress, setProgress] = useState(0);

  const profileCompletion = 95;

  // useEffect(() => {
  //   // Count how many profile fields are filled
  //   const totalFields = 4; // e.g. name, email, contact, profilePicture
  //   let filled = 0;

  //   if (user.firstName && user.lastName) filled++;
  //   if (user.email) filled++;
  //   if (user.contact) filled++;
  //   if (user.profilePicture) filled++;

  //   const percentage = Math.round((filled / totalFields) * 100);
  //   setProgress(percentage);
  // }, [user]);
  // user comes as prop

  return (
    <div className="min-h-screen bg-white p-6 rounded-lg">
      <div className=" mx-auto ">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-semibold text-gray-900">User Profile</h1>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-1.5 border border-[#818181] rounded-md text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Back
          </button>
        </div>

        {/* Main Container */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-2">
          {/* Profile Progress bar */}
          <div className="m-6 bg-gradient-to-r from-[#FFFDF5] to-[#FEF8E9] border border-orange-100 rounded-lg p-5 flex items-start gap-4">
            <div className="relative w-14 h-14 flex-shrink-0">
              <svg className="w-14 h-14 transform -rotate-90">
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="#FED7AA"
                  strokeWidth="5"
                  fill="none"
                />
                <circle
                  cx="28"
                  cy="28"
                  r="24"
                  stroke="#F97316"
                  strokeWidth="5"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${
                    2 * Math.PI * 24 * (1 - profileCompletion / 100)
                  }`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-800">
                  {profileCompletion}%
                </span>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-gray-600 text-base mb-1">
                Complete your profile
              </h3>
              <p className="text-sm text-gray-500">
                Please add a profile picture to complete your profile.
              </p>
            </div>
          </div>

          {/* Profile Section */}
          <div className="px-6 pb-6">
            <div className="flex items-center mt-6 gap-5 mb-8">
              <div className="relative group cursor-pointer">
                <div className="w-28 h-28 mt-2 rounded-full bg-[#818181] flex flex-col items-center justify-center text-white">
                  <MdOutlineAddAPhoto className="w-8 h-8 mb-1" />
                  <span className="text-sm font-medium">Add Photo</span>
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                  Yash Manocha
                </h2>
                <p className="text-base text-gray-500">User Account</p>
              </div>
            </div>

            {/* Form Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Full Name */}
              <div className="grid grid-cols-12 border-b border-gray-200">
                <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-200 flex items-center justify-center">
                  <label className="text-base font-medium text-[#414141]">
                    Full Name
                  </label>
                </div>
                <div className="col-span-9 px-6 py-4 flex gap-4 bg-white">
                  <input
                    type="text"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="flex-1 max-w-[300px] px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="flex-1 max-w-[300px] px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                  />
                </div>
              </div>

              {/* Contact Number */}
              <div className="grid grid-cols-12 border-b border-gray-200">
                <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-200 flex items-center justify-center">
                  <label className="text-base font-medium text-[#414141]">
                    Contact Number
                  </label>
                </div>
                <div className="col-span-9 px-6 py-4 flex gap-4 bg-white">
                  <select
                    value={formData.countryCode}
                    onChange={(e) =>
                      setFormData({ ...formData, countryCode: e.target.value })
                    }
                    className="col-span-2 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter Contact No."
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="flex-1 max-w-[300px] px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                  />
                </div>
              </div>

              {/* Email */}
              <div className="grid grid-cols-12 border-b border-gray-200">
                <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-200 flex items-center justify-center">
                  <label className="text-base font-medium text-[#414141]">
                    Email
                  </label>
                </div>
                <div className="col-span-9 px-6 py-4 bg-white">
                  <input
                    type="email"
                    placeholder="Enter Email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-[300px] px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                  />
                </div>
              </div>

              {/* Designation */}
              <div className="grid grid-cols-12 border-b border-gray-200">
                <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-200 flex items-center justify-center">
                  <label className="text-base font-medium text-[#414141]">
                    Designation
                  </label>
                </div>
                <div className="col-span-9 px-6 py-4 bg-white">
                  <input
                    type="text"
                    placeholder="Enter Designation"
                    value={formData.designation}
                    onChange={(e) =>
                      setFormData({ ...formData, designation: e.target.value })
                    }
                    className="w-[300px] px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                  />
                </div>
              </div>

              {/* Gender */}
              <div className="grid grid-cols-12 border-b border-gray-200">
                <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-200 flex items-center justify-center">
                  <label className="text-base font-medium text-[#414141]">
                    Gender
                  </label>
                </div>
                <div className="col-span-9 px-6 py-4 bg-white">
                  <input
                    type="text"
                    placeholder="Enter Your Gender"
                    value={formData.gender}
                    onChange={(e) =>
                      setFormData({ ...formData, gender: e.target.value })
                    }
                    className="w-[300px] px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                  />
                </div>
              </div>

              {/* Date of Birth */}
              <div className="grid grid-cols-12 border-b border-gray-200">
                <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-200 flex items-center justify-center">
                  <label className="text-base font-medium text-[#414141]">
                    Date of Birth
                  </label>
                </div>
                <div className="col-span-9 px-6 py-4 bg-white">
                  <input
                    type="text"
                    placeholder="Enter Date of Birth"
                    value={formData.dob}
                    onChange={(e) =>
                      setFormData({ ...formData, dob: e.target.value })
                    }
                    className="w-[300px] px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-12">
                <div className="col-span-3 bg-[#F8F8F8] px-6 py-6 border border-gray-200 flex items-center justify-center">
                  <label className="text-base font-medium text-[#414141]">
                    Emergency Contact
                  </label>
                </div>
                <div className="col-span-9 px-6 py-4 bg-white">
                  <input
                    type="text"
                    placeholder="Enter Emergency Contact"
                    value={formData.emergencyContact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: e.target.value,
                      })
                    }
                    className="w-[300px] px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
