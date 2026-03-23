// Transform Sequelize model to MongoDB-style response (id -> _id)
const transformResponse = (data) => {
  if (!data) return null;
  
  // Handle array
  if (Array.isArray(data)) {
    return data.map(item => transformResponse(item));
  }
  
  // Handle Sequelize instance
  const obj = data.toJSON ? data.toJSON() : { ...data };
  
  // Convert id to _id
  if (obj.id && !obj._id) {
    obj._id = obj.id;
    delete obj.id;
  }
  
  // Remove Sequelize metadata
  delete obj.createdAt;
  delete obj.updatedAt;
  delete obj.deletedAt;
  
  return obj;
};

// Format success response
const successResponse = (data, message = 'Success') => {
  return {
    success: true,
    message,
    ...(data && { ...transformResponse(data) })
  };
};

// Format error response
const errorResponse = (message, statusCode = 500) => {
  return {
    success: false,
    message,
    statusCode
  };
};

module.exports = { transformResponse, successResponse, errorResponse };