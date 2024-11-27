const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const products = [
        {
            name: 'Motherboard',
            description: 'High-quality motherboard compatible with latest processors.',
            cost: 120.00,
            image_filename: 'pic1.jpg',
        },
        {
            name: 'CPU',
            description: 'Powerful 8-core CPU with fast processing speeds.',
            cost: 300.00,
            image_filename: 'pic2.jpg',
        },
        {
            name: 'Desktop Case',
            description: 'Mid-tower case with excellent airflow and cable management.',
            cost: 80.00,
            image_filename: 'pic3.jpg',
        },
        {
            name: 'Power Supply',
            description: 'Reliable 750W power supply with 80+ gold efficiency.',
            cost: 100.00,
            image_filename: 'pic4.jpg',
        },
        {
            name: 'SSD',
            description: 'Fast 500GB SSD for quicker load times and system responsiveness.',
            cost: 55.00,
            image_filename: 'pic5.jpg',
        },
        {
            name: 'CPU Cooler',
            description: 'Efficient CPU cooler to keep temperatures low during heavy use.',
            cost: 40.00,
            image_filename: 'pic6.jpg',
        },
        {
            name: 'RAM',
            description: '16GB DDR4 RAM, great for gaming and multitasking.',
            cost: 75.00,
            image_filename: 'pic7.jpg',
        },
        {
            name: 'GPU',
            description: 'High-performance graphics card suitable for gaming and video editing.',
            cost: 450.00,
            image_filename: 'pic8.jpg',
        },
        {
            name: 'Keyboard',
            description: 'Mechanical keyboard with customizable RGB lighting.',
            cost: 60.00,
            image_filename: 'pic9.jpg',
        },
        {
            name: 'Mouse',
            description: 'Ergonomic gaming mouse with adjustable DPI and RGB lighting.',
            cost: 40.00,
            image_filename: 'pic10.jpg',
        },
    ];

    // Insert products into the database
    for (const product of products) {
        await prisma.product.create({
            data: product,
        });
    }

    console.log('Seeded 10 products!');
}

main()
    .catch(e => {
        console.error(e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
