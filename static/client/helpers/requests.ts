export const parseError = (error: any) => {
  let message = "An unexpected error occurred";
  let description = "Please try again later, or contact support.";
  let status = null;

  if (error.response) {
    status = error.response.status;
    const data = error.response.data;

    message = data?.error || data?.message || `Error ${status}`;
  } else if (error.request) {
    message = "Network Error";
    description = "We could not reach the server. Please check your internet connection and try again.";
  } else {
    message = "Request Error";
    description = error.message || "An error occurred while setting up the request.";
  }

  return { message, description, status };
};
