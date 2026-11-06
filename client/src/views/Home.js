import React, { useMemo, useState } from 'react';

import { Box } from '@mui/material';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import PlaceIcon from '@mui/icons-material/Place';
import EventIcon from '@mui/icons-material/Event';
import { SearchBar } from '../components/Navbar.tsx';

// Demo content: the categories and three events each per country, hardcoded so the page shows
// something without an events backend. The search box and the tabs filter them.
const CATEGORIES = ['Todos', 'Fiestas', 'Teatros', 'Familia', 'Deportes', 'Shows', 'Ferias', 'Festivales', 'Retiros'];

// The navbar's flag picks the country (0 = Chile, 1 = Argentina, as in Navbar.tsx)
const COUNTRY_CODES = ['CL', 'AR'];

const photo = (id) => `https://images.unsplash.com/${id}?w=600&h=360&fit=crop`;

const EVENTS = [
    { title: 'Noche Electrónica en la Costa', category: 'Fiestas', place: 'Club Playa, Mar del Plata', date: '14 Nov', price: '$12.000', country: 'AR', organizer: 'Costa Beats', image: photo('photo-1470225620780-dba8ba36b745') },
    { title: 'Fiesta de los 90', category: 'Fiestas', place: 'Teatro Vorterix, Buenos Aires', date: '21 Nov', price: '$9.500', country: 'AR', organizer: 'Retro Nights', image: photo('photo-1514525253161-7a46d19cd819') },
    { title: 'Sunset en la Terraza', category: 'Fiestas', place: 'Puerto Madero, Buenos Aires', date: '28 Nov', price: '$11.000', country: 'AR', organizer: 'Terraza Club', image: photo('photo-1533174072545-7a4b6ad7a6c3') },
    { title: 'Carnaval de Verano', category: 'Fiestas', place: 'Parque Costero, Viña del Mar', date: '5 Dic', price: '$8.000', country: 'CL', organizer: 'Viña Vive', image: photo('photo-1470225620780-dba8ba36b745') },
    { title: 'Noche Latina', category: 'Fiestas', place: 'Club Blondie, Santiago', date: '15 Nov', price: '$10.000', country: 'CL', organizer: 'Blondie', image: photo('photo-1514525253161-7a46d19cd819') },
    { title: 'Fiesta Bajo las Estrellas', category: 'Fiestas', place: 'Cerro Alegre, Valparaíso', date: '22 Nov', price: '$7.500', country: 'CL', organizer: 'Puerto Noche', image: photo('photo-1533174072545-7a4b6ad7a6c3') },
    { title: 'La Casa de Bernarda Alba', category: 'Teatros', place: 'Teatro San Martín, Buenos Aires', date: '16 Nov', price: '$15.000', country: 'AR', organizer: 'Compañía del Sur', image: photo('photo-1503095396549-807759245b35') },
    { title: 'Monólogos de Medianoche', category: 'Teatros', place: 'Sala Pequeña, Córdoba', date: '23 Nov', price: '$7.000', country: 'AR', organizer: 'Risa Abierta', image: photo('photo-1507676184212-d03ab07a01bf') },
    { title: 'Esperando a Godot', category: 'Teatros', place: 'Teatro El Círculo, Rosario', date: '30 Nov', price: '$12.000', country: 'AR', organizer: 'Teatro Independiente', image: photo('photo-1514306191717-452ec28c7814') },
    { title: 'Noche de Improvisación', category: 'Teatros', place: 'Teatro Mori, Santiago', date: '27 Nov', price: '$9.000', country: 'CL', organizer: 'Impro Chile', image: photo('photo-1503095396549-807759245b35') },
    { title: 'La Negra Ester', category: 'Teatros', place: 'Teatro Municipal, Valparaíso', date: '18 Nov', price: '$14.000', country: 'CL', organizer: 'Gran Circo Teatro', image: photo('photo-1507676184212-d03ab07a01bf') },
    { title: 'Pequeñas Historias', category: 'Teatros', place: 'Sala Agustín Siré, Santiago', date: '2 Dic', price: '$8.000', country: 'CL', organizer: 'Teatro Joven', image: photo('photo-1514306191717-452ec28c7814') },
    { title: 'Feria de Dinosaurios', category: 'Familia', place: 'Centro de Convenciones, Rosario', date: '29 Nov', price: '$6.500', country: 'AR', organizer: 'Museo Vivo', image: photo('photo-1464047736614-af63643285bf') },
    { title: 'Show de Burbujas Gigantes', category: 'Familia', place: 'Parque Sarmiento, Córdoba', date: '16 Nov', price: '$5.000', country: 'AR', organizer: 'Burbujas y Más', image: photo('photo-1519074069444-1ba4fff66d16') },
    { title: 'Títeres en el Parque', category: 'Familia', place: 'Parque Centenario, Buenos Aires', date: '23 Nov', price: 'Gratis', country: 'AR', organizer: 'Títeres del Barrio', image: photo('photo-1472162072942-cd5147eb3902') },
    { title: 'Circo de las Estrellas', category: 'Familia', place: 'Carpa Mayor, Santiago', date: '15 Nov', price: '$10.000', country: 'CL', organizer: 'Circo Estelar', image: photo('photo-1464047736614-af63643285bf') },
    { title: 'Domingo de Ciencia', category: 'Familia', place: 'Museo Interactivo, Santiago', date: '24 Nov', price: '$6.000', country: 'CL', organizer: 'MIM', image: photo('photo-1519074069444-1ba4fff66d16') },
    { title: 'Picnic de Cuentos', category: 'Familia', place: 'Jardín Botánico, Viña del Mar', date: '1 Dic', price: 'Gratis', country: 'CL', organizer: 'Cuentacuentos', image: photo('photo-1472162072942-cd5147eb3902') },
    { title: 'Maratón de la Ciudad 10K', category: 'Deportes', place: 'Costanera Sur, Buenos Aires', date: '17 Nov', price: '$5.000', country: 'AR', organizer: 'Corre BA', image: photo('photo-1452626038306-9aae5e071dd3') },
    { title: 'Clásico de Básquet', category: 'Deportes', place: 'Estadio Polideportivo, Mendoza', date: '24 Nov', price: '$11.000', country: 'AR', organizer: 'Liga Regional', image: photo('photo-1546519638-68e109498ffc') },
    { title: 'Torneo de Beach Vóley', category: 'Deportes', place: 'Playa Grande, Mar del Plata', date: '8 Dic', price: '$4.000', country: 'AR', organizer: 'Vóley Costa', image: photo('photo-1486218119243-13883505764c') },
    { title: 'Trail Running Andes', category: 'Deportes', place: 'Farellones, Santiago', date: '1 Dic', price: '$12.000', country: 'CL', organizer: 'Andes Trail', image: photo('photo-1452626038306-9aae5e071dd3') },
    { title: 'Clásico Universitario', category: 'Deportes', place: 'Estadio Nacional, Santiago', date: '20 Nov', price: '$15.000', country: 'CL', organizer: 'Fútbol Chile', image: photo('photo-1546519638-68e109498ffc') },
    { title: 'Surf Open', category: 'Deportes', place: 'Punta de Lobos, Pichilemu', date: '6 Dic', price: 'Gratis', country: 'CL', organizer: 'Surf Chile', image: photo('photo-1486218119243-13883505764c') },
    { title: 'Noche de Stand Up', category: 'Shows', place: 'Paseo La Plaza, Buenos Aires', date: '20 Nov', price: '$9.000', country: 'AR', organizer: 'Humor en Vivo', image: photo('photo-1527224857830-43a7acc85260') },
    { title: 'Tango en el Abasto', category: 'Shows', place: 'Esquina Carlos Gardel, Buenos Aires', date: '27 Nov', price: '$18.000', country: 'AR', organizer: 'Tango Porteño', image: photo('photo-1501386761578-eac5c94b800a') },
    { title: 'Rock Nacional en Vivo', category: 'Shows', place: 'Luna Park, Buenos Aires', date: '4 Dic', price: '$20.000', country: 'AR', organizer: 'Rock y Co', image: photo('photo-1540039155733-5bb30b53aa14') },
    { title: 'Tributo a Soda Stereo', category: 'Shows', place: 'Teatro Caupolicán, Santiago', date: '28 Nov', price: '$14.000', country: 'CL', organizer: 'Sonido Latino', image: photo('photo-1527224857830-43a7acc85260') },
    { title: 'Noche de Magia', category: 'Shows', place: 'Teatro Oriente, Santiago', date: '19 Nov', price: '$11.000', country: 'CL', organizer: 'Magia Viva', image: photo('photo-1501386761578-eac5c94b800a') },
    { title: 'Humor de Puerto', category: 'Shows', place: 'Teatro Condell, Valparaíso', date: '3 Dic', price: '$8.000', country: 'CL', organizer: 'Risas del Puerto', image: photo('photo-1540039155733-5bb30b53aa14') },
    { title: 'Mercado de Diseño', category: 'Ferias', place: 'Palermo, Buenos Aires', date: '30 Nov', price: 'Gratis', country: 'AR', organizer: 'Diseño Local', image: photo('photo-1495446815901-a7297e633e8d') },
    { title: 'Feria de Vinos', category: 'Ferias', place: 'Parque General San Martín, Mendoza', date: '22 Nov', price: '$9.000', country: 'AR', organizer: 'Vinos de Cuyo', image: photo('photo-1555529669-e69e7aa0ba9a') },
    { title: 'Feria de Antigüedades', category: 'Ferias', place: 'Plaza Dorrego, Buenos Aires', date: '7 Dic', price: 'Gratis', country: 'AR', organizer: 'San Telmo Antiguo', image: photo('photo-1488459716781-31db52582fe9') },
    { title: 'Feria del Libro Independiente', category: 'Ferias', place: 'Centro Cultural, Valparaíso', date: '22 Nov', price: 'Gratis', country: 'CL', organizer: 'Editoriales del Puerto', image: photo('photo-1495446815901-a7297e633e8d') },
    { title: 'Mercado Orgánico', category: 'Ferias', place: 'Parque Bicentenario, Santiago', date: '16 Nov', price: 'Gratis', country: 'CL', organizer: 'Huertos Urbanos', image: photo('photo-1555529669-e69e7aa0ba9a') },
    { title: 'Feria de Artesanía', category: 'Ferias', place: 'Plaza de Armas, La Serena', date: '30 Nov', price: 'Gratis', country: 'CL', organizer: 'Artesanos del Norte', image: photo('photo-1488459716781-31db52582fe9') },
    { title: 'Festival de Jazz al Aire Libre', category: 'Festivales', place: 'Parque Centenario, Buenos Aires', date: '6 Dic', price: '$8.500', country: 'AR', organizer: 'Jazz Abierto', image: photo('photo-1415201364774-f6f0bb35f28f') },
    { title: 'Festival de Folklore', category: 'Festivales', place: 'Anfiteatro, Cosquín', date: '12 Dic', price: '$10.000', country: 'AR', organizer: 'Cosquín Folk', image: photo('photo-1555939594-58d7cb561ad1') },
    { title: 'Festival de Cine Corto', category: 'Festivales', place: 'Cine Gaumont, Buenos Aires', date: '15 Nov', price: '$3.000', country: 'AR', organizer: 'Cortos BA', image: photo('photo-1459749411175-04bf5292ceea') },
    { title: 'Festival Gastronómico del Sur', category: 'Festivales', place: 'Puerto Varas', date: '13 Dic', price: '$6.000', country: 'CL', organizer: 'Sabores del Sur', image: photo('photo-1415201364774-f6f0bb35f28f') },
    { title: 'Festival de la Cerveza', category: 'Festivales', place: 'Valdivia', date: '29 Nov', price: '$7.000', country: 'CL', organizer: 'Cerveceros del Sur', image: photo('photo-1555939594-58d7cb561ad1') },
    { title: 'Festival de Música Andina', category: 'Festivales', place: 'Plaza Ñuñoa, Santiago', date: '21 Nov', price: 'Gratis', country: 'CL', organizer: 'Música Andina', image: photo('photo-1459749411175-04bf5292ceea') },
    { title: 'Fin de Semana de Meditación', category: 'Retiros', place: 'Sierras de Córdoba', date: '14 Dic', price: '$38.000', country: 'AR', organizer: 'Silencio', image: photo('photo-1506126613408-eca07ce68773') },
    { title: 'Retiro de Escritura', category: 'Retiros', place: 'Tigre, Buenos Aires', date: '23 Nov', price: '$30.000', country: 'AR', organizer: 'Palabra Viva', image: photo('photo-1545389336-cf090694435e') },
    { title: 'Yoga entre Viñedos', category: 'Retiros', place: 'Valle de Uco, Mendoza', date: '7 Dic', price: '$42.000', country: 'AR', organizer: 'Viñas y Calma', image: photo('photo-1518241353330-0f7941c2d9b5') },
    { title: 'Retiro de Yoga en la Montaña', category: 'Retiros', place: 'Cajón del Maipo', date: '7 Dic', price: '$45.000', country: 'CL', organizer: 'Respira', image: photo('photo-1506126613408-eca07ce68773') },
    { title: 'Silencio en el Bosque', category: 'Retiros', place: 'Pucón', date: '16 Nov', price: '$40.000', country: 'CL', organizer: 'Bosque Interior', image: photo('photo-1545389336-cf090694435e') },
    { title: 'Retiro Frente al Mar', category: 'Retiros', place: 'Matanzas', date: '24 Nov', price: '$36.000', country: 'CL', organizer: 'Olas y Aire', image: photo('photo-1518241353330-0f7941c2d9b5') },
];

function matches(event, text)
{
    if(!text)
        return true;
    const q = text.toLowerCase();
    return [event.title, event.place, event.organizer, event.category].some(v => v.toLowerCase().includes(q));
}

function EventCard({ event })
{
    return (
        <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 3, boxShadow: 3,
            transition: 'transform .2s, box-shadow .2s', '&:hover': { transform: 'translateY(-4px)', boxShadow: 8 } }}>
            <CardMedia component="img" height="160" image={event.image} alt="" />
            <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Chip size="small" label={event.category} color="secondary" variant="outlined" />
                    <Typography variant="subtitle2" color="primary" fontWeight={700}>{event.price}</Typography>
                </Box>
                <Typography variant="h6" component="h3" sx={{ fontSize: '1.05rem', lineHeight: 1.3, mb: 1 }}>{event.title}</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <PlaceIcon fontSize="inherit" /> {event.place}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <EventIcon fontSize="inherit" /> {event.date} · {event.organizer}
                </Typography>
            </CardContent>
        </Card>
    );
}

function Home({ countryIdx })
{
    const country = COUNTRY_CODES[countryIdx] || COUNTRY_CODES[0];
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState(0);

    // The flag picks the country, the tab narrows to one category, the search box narrows further.
    const sections = useMemo(() => {
        const wanted = category === 0 ? CATEGORIES.slice(1) : [CATEGORIES[category]];
        return wanted
            .map(name => ({ name, events: EVENTS.filter(e => e.country === country && e.category === name && matches(e, search)) }))
            .filter(s => s.events.length > 0);
    }, [search, category, country]);

    return (
        <div>
            <Box sx={{ paddingTop: '3vh' }}></Box>
            <Box sx={{ paddingLeft: '5vw', paddingRight: '5vw', paddingBottom: '6vh' }}>
                <SearchBar value={search} onChange={setSearch}></SearchBar>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mt: 1 }}>
                    <Tabs value={category} onChange={(ev, idx) => setCategory(idx)} scrollButtons allowScrollButtonsMobile
                        aria-label="categories" variant="scrollable">
                        {CATEGORIES.map((name) => <Tab key={name} label={name} />)}
                    </Tabs>
                </Box>
                {
                    sections.length === 0 ?
                    (<Typography sx={{ pt: 6, textAlign: 'center' }} color="text.secondary">
                        No hay eventos para "{search}"
                    </Typography>)
                    :
                    sections.map(section => (
                        <Box key={section.name} sx={{ pt: 4 }}>
                            <Typography variant="h5" component="h2" sx={{ mb: 2, fontWeight: 600, textAlign: 'center' }}>{section.name}</Typography>
                            <Grid container spacing={3} justifyContent="center">
                                {section.events.map(event => (
                                    <Grid item key={event.title} xs={12} sm={6} md={4} lg={3}>
                                        <EventCard event={event} />
                                    </Grid>
                                ))}
                            </Grid>
                        </Box>
                    ))
                }
            </Box>
        </div>
    );
}

export default Home;
