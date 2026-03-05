const { db } = require('./config/firebase');

const seedData = async () => {
    const packages = [
        { name: 'Wedding Package', price: 100, description: 'Complete grooming for the big day.', category: 'package' },
        { name: 'Birthday Package', price: 50, description: 'Look your best for your birthday.', category: 'package' },
        { name: 'Graduation Package', price: 60, description: 'Graduation special grooming.', category: 'package' },
        { name: 'Holiday Package', price: 40, description: 'Seasonal grooming specials.', category: 'package' },
        { name: 'Special Ceremonies', price: 80, description: 'Grooming for any special event.', category: 'package' },
    ];

    const styles = [
        { name: 'Regular Haircut', price: 20, description: 'Standard men\'s haircut.', category: 'style' },
        { name: 'Fade', price: 25, description: 'Modern fade haircut.', category: 'style' },
        { name: 'Buzz Cut', price: 15, description: 'Simple short buzz cut.', category: 'style' },
        { name: 'Beard Trim', price: 10, description: 'Professional beard grooming.', category: 'style' },
    ];

    try {
        for (const p of packages) {
            await db.collection('packages').add(p);
        }
        for (const s of styles) {
            await db.collection('styles').add(s);
        }
        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding database:', error);
    }
};

seedData();
