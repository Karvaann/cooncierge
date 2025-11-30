import apiClient from "@/services/apiClient";

// Create Team
export const createTeam = async (teamData: any) => {
  try {
    const response = await apiClient.post("/team/create-team", teamData);
    return response.data.team;
  } catch (error: any) {
    console.error("Failed to create team:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// Get All Teams
export const getTeams = async () => {
  try {
    const response = await apiClient.get("/team/get-all-teams");
    return response.data; // backend returns an array of teams directly
  } catch (error: any) {
    console.error("Failed to fetch teams:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// Get Team By ID
export const getTeamById = async (id: string) => {
  try {
    const response = await apiClient.get(`/team/get-team/${id}`);
    return response.data.team;
  } catch (error: any) {
    console.error("Failed to fetch team by ID:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// Update Team
export const updateTeam = async (id: string, teamData: any) => {
  try {
    const response = await apiClient.put(`/team/update-team/${id}`, teamData);
    return response.data.team;
  } catch (error: any) {
    console.error("Failed to update team:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

// Delete Team
export const deleteTeam = async (id: string) => {
  try {
    const response = await apiClient.delete(`/team/delete-team/${id}`);
    return response.data; // backend returns { message: 'Team deleted' }
  } catch (error: any) {
    console.error("Failed to delete team:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};
