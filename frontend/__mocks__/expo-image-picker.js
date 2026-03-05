// Manual mock for expo-image-picker
module.exports = {
    launchImageLibraryAsync: jest.fn().mockResolvedValue({ canceled: true }),
    launchCameraAsync: jest.fn().mockResolvedValue({ canceled: true }),
    requestMediaLibraryPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
    MediaTypeOptions: { Images: 'Images', Videos: 'Videos', All: 'All' },
};
