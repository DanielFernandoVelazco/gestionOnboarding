import { DataSource } from 'typeorm';
import { OnboardingTipo } from '../modules/onboarding/entities/onboarding-tipo.entity';

export async function seedOnboardingTipos(dataSource: DataSource) {
    const tiposRepository = dataSource.getRepository(OnboardingTipo);

    const tipos = [
        {
            nombre: 'Journey to Cloud',
            color: '#E31937', // Rojo
            descripcion: 'Onboarding para desarrolladores Cloud',
            duracionDias: 3,
        },
        {
            nombre: 'Capítulo Data',
            color: '#FFD100', // Amarillo
            descripcion: 'Onboarding para analistas de datos',
            duracionDias: 2,
        },
        {
            nombre: 'Capítulo Frontend',
            color: '#00448D', // Azul
            descripcion: 'Onboarding para desarrolladores Frontend',
            duracionDias: 2,
        },
        {
            nombre: 'Capítulo Backend',
            color: '#FF6B35', // Naranja
            descripcion: 'Onboarding para desarrolladores Backend',
            duracionDias: 2,
        },
    ];

    for (const tipo of tipos) {
        const exists = await tiposRepository.findOne({
            where: { nombre: tipo.nombre },
        });

        if (!exists) {
            await tiposRepository.save(tiposRepository.create(tipo));
            console.log(`Tipo de onboarding creado: ${tipo.nombre}`);
        }
    }
}