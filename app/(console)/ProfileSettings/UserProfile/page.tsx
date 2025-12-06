"use client";
import React, { useState, useEffect, useRef, useCallback } from "react";
import { MdOutlineAddAPhoto } from "react-icons/md";
import { useRouter } from "next/navigation";
import { uploadProfileImage, getUserById } from "@/services/userApi";
import { setAuthUser } from "@/services/storage/authStorage";

const UserProfile = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("");
  const [gender, setGender] = useState("");
  const [dob, setDob] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  const getProfileCompletion = useCallback((userObj: Record<string, unknown>) => {
    const values = Object.values(userObj);
    const filled = values.filter(v => v && String(v).trim() !== "").length;
    return Math.round((filled / values.length) * 100);
  }, []);

  // Load user data from localStorage
  const loadUserData = useCallback((user: Record<string, unknown>) => {
    setFirstName((user.name as string)?.split(" ")[0] || "");
    setLastName((user.name as string)?.split(" ")[1] || "");
    setEmail((user.email as string) || "");
    setDesignation((user.designation as string) || "");
    setGender((user.gender as string) || "");
    setDob((user.dob as string) || "");
    setEmergencyContact((user.emergencyContact as string) || "");
    setCountryCode((user.countryCode as string) || "+91");
    setPhone((user.mobile as string) || "");
    setProgress(getProfileCompletion(user));
    // Load profile image from user data
    if (user.profileImage) {
      setProfilePhoto(user.profileImage.url as string);
    }
  }, [getProfileCompletion]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    // Show preview immediately
    const imageUrl = URL.createObjectURL(file);
    setProfilePhoto(imageUrl);

    try {
      setIsUploading(true);

      // Upload to backend
      await uploadProfileImage(userId, file);

      // Fetch updated user data from backend
      const updatedUser = await getUserById(userId);

      // Update localStorage with new user data
      setAuthUser(updatedUser);

      // Reload user data from localStorage
      loadUserData(updatedUser);

      // Revoke the blob URL to free up memory
      URL.revokeObjectURL(imageUrl);
    } catch (error) {
      console.error("Failed to upload profile image:", error);
      // Revert to previous photo if upload fails
      const storedUser = window.localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        setProfilePhoto(user.profileImage || null);
      }
      URL.revokeObjectURL(imageUrl);
    } finally {
      setIsUploading(false);
    }
  };

  useEffect(() => {
    // Access localStorage only on client-side
    const storedUser = window.localStorage.getItem("user");
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setUserId(user._id || user.id || null);
      loadUserData(user);
    }
  }, [loadUserData]);

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
                    2 * Math.PI * 24 * (1 - progress / 100)
                  }`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-800">
                  {progress}%
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
              <div
                className={`relative group ${isUploading ? 'cursor-wait' : 'cursor-pointer'}`}
                onClick={handlePhotoClick}
              >
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  disabled={isUploading}
                />
                {profilePhoto ? (
                  // Show selected photo
                  <div className="w-28 h-28 mt-2 rounded-full overflow-hidden border-2 border-gray-200 hover:border-emerald-500 transition-colors relative">
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className={`w-full h-full object-cover ${isUploading ? 'opacity-50' : ''}`}
                    />
                    {/* Loading overlay */}
                    {isUploading && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                        <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    )}
                    {/* Overlay on hover (only when not uploading) */}
                    {!isUploading && (
                      <div className="absolute inset-0 rounded-full bg-black bg-opacity-40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <MdOutlineAddAPhoto className="w-6 h-6 text-white mb-1" />
                        <span className="text-xs font-medium text-white">Change</span>
                      </div>
                    )}
                  </div>
                ) : (
                  // Show add photo placeholder
                  <div className={`w-28 h-28 mt-2 rounded-full bg-[#818181] flex flex-col items-center justify-center text-white ${isUploading ? '' : 'hover:bg-[#6a6a6a]'} transition-colors`}>
                    {isUploading ? (
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <MdOutlineAddAPhoto className="w-8 h-8 mb-1" />
                        <span className="text-sm font-medium">Add Photo</span>
                      </>
                    )}
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-1">
                  {firstName} {lastName}
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
                    value={firstName}
                    disabled
                    className="flex-1 max-w-[300px] px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 text-base"
                  />
                  <input
                    type="text"
                    placeholder="Last Name"
                    value={lastName}
                    disabled
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
                    value={countryCode}
                    disabled
                    className="col-span-2 px-2 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="+91">+91</option>
                    <option value="+1">+1</option>
                    <option value="+44">+44</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Enter Contact No."
                    value={phone}
                    disabled
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
                    value={email}
                    disabled
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
                    value={designation}
                    disabled
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
                    value={gender}
                    disabled
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
                    value={dob}
                    disabled
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
                    value={emergencyContact}
                    onChange={(e) =>
                      setEmergencyContact(e.target.value)
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
