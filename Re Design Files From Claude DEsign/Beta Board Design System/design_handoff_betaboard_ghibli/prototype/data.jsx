// data.jsx — mock content for the Beta Board Ghibli app (no backend).

const GYMS = [
  { id:1, name:'Northside Boulders', location:'Fortitude Valley, Brisbane', wall_count:3, climb_count:28, is_active:true,  lat:-27.45, lng:153.03, strip:'Orange' },
  { id:2, name:'Urban Climb',        location:'Milton, Brisbane',           wall_count:4, climb_count:41, is_active:true,  lat:-27.47, lng:153.00, strip:'Blue' },
  { id:3, name:'The Cave',           location:'Newstead, Brisbane',         wall_count:2, climb_count:16, is_active:false, lat:-27.44, lng:153.04, strip:'Pink' },
];

const WALLS = [ { id:1, name:'Crimp Wall' }, { id:2, name:'The Slab' }, { id:3, name:'Overhang Cave' } ];

const CLIMBS = [
  { id:1, name:'Crimpy arête',     colour:'Orange', suggested_grade:5, community_grade:6,   added_by:'sashaT', set_at:'2025-03-12', wall_name:'Crimp Wall', sends:42, reviews:11 },
  { id:2, name:'Sloper city',      colour:'Blue',   suggested_grade:3, community_grade:3,   added_by:'sashaT', set_at:'2025-03-12', wall_name:'Crimp Wall', sends:67, reviews:14 },
  { id:3, name:'The Pinch',        colour:'Pink',   suggested_grade:7, community_grade:null, added_by:'mxbeta', set_at:'2025-03-10', wall_name:'Crimp Wall', sends:8,  reviews:3 },
  { id:4, name:'Heel hook heaven', colour:'Green',  suggested_grade:4, community_grade:5,   added_by:'sashaT', set_at:'2025-03-09', wall_name:'Crimp Wall', sends:31, reviews:9 },
  { id:5, name:'Dyno or die',      colour:'Yellow', suggested_grade:9, community_grade:10,  added_by:'mxbeta', set_at:'2025-03-08', wall_name:'Crimp Wall', sends:5,  reviews:2 },
  { id:6, name:'Crack attack',     colour:'Black',  suggested_grade:6, community_grade:6,   added_by:'sashaT', set_at:'2025-03-07', wall_name:'Crimp Wall', sends:19, reviews:6 },
];

const REVIEWS = [
  { id:1, username:'leah_climbs', stars:5, attempts:4, comment:'Tricky beta on the crux but so satisfying once it clicks. Best route on the wall.' },
  { id:2, username:'mxbeta',      stars:4, attempts:7, comment:'Soft for the grade imo but a really fun sequence. Heel hook is key.' },
  { id:3, username:'tom_v',       stars:5, attempts:2, comment:'Flashed it on the second go — gorgeous movement.' },
];

const LEADERBOARD = [
  { user_id:1, username:'sashaT',      points:4820, send_count:96, rank:1 },
  { user_id:2, username:'mxbeta',      points:3140, send_count:71, rank:2 },
  { user_id:3, username:'leah_climbs', points:2260, send_count:58, rank:3 },
  { user_id:7, username:'you',         points:1240, send_count:34, rank:8 },
  { user_id:4, username:'tom_v',       points:980,  send_count:29, rank:9 },
  { user_id:5, username:'kira',        points:640,  send_count:21, rank:12 },
  { user_id:6, username:'devon',       points:280,  send_count:11, rank:18 },
];

const ME = {
  username:'you', date_joined:'2024-08-01', points:1240, home_gym:'Northside Boulders',
  sends:[
    { id:1, climb_name:'Crimpy arête',     climb_colour:'Orange', climb_grade:5, attempts:4, wall_name:'Crimp Wall', gym_name:'Northside Boulders' },
    { id:2, climb_name:'Heel hook heaven', climb_colour:'Green',  climb_grade:4, attempts:2, wall_name:'Crimp Wall', gym_name:'Northside Boulders' },
    { id:3, climb_name:'Crack attack',     climb_colour:'Black',  climb_grade:6, attempts:9, wall_name:'Crimp Wall', gym_name:'Northside Boulders' },
  ],
  reviews:[
    { id:1, climb_name:'Crimpy arête', stars:5, comment:'Best route on the wall, beautiful sequence.', wall_name:'Crimp Wall', gym_name:'Northside Boulders' },
  ],
  videos:2,
};

const COMPETITIONS = [
  { id:1, title:'Autumn Throwdown',     comp_type:'qualifier', status:'open',     start_date:'2025-04-01', end_date:'2025-04-14', registration_count:64, top_x_advance:20, is_registered:true,  description:'Open qualifier — log your top 5 sends across the comp set. Top 20 advance to finals.', rules:'Score = sum of your 5 highest-value comp climbs.\nTies broken by fewest total attempts.', divisions:['Open','Women\u2019s','Novice'], rounds:['Qualifier','Final'] },
  { id:2, title:'Northside Finals 2025', comp_type:'finals',    status:'upcoming', start_date:'2025-04-20', end_date:'2025-04-20', registration_count:20, is_registered:false, description:'Invite-only finals for the top 20 qualifiers. Four problems, one session.', divisions:['Open'], rounds:['Final'] },
  { id:3, title:'Summer Send Fest',     comp_type:'qualifier', status:'closed',   start_date:'2025-01-10', end_date:'2025-01-24', registration_count:88, is_registered:false, description:'Our biggest jam yet — thanks to everyone who came out.' },
];

const COMP_CLIMBS = [
  { id:1, climb_name:'Crimpy arête',     climb_colour:'Orange', climb_grade:5, wall_name:'Crimp Wall', points_value:120, my_send:{ attempts:4 } },
  { id:2, climb_name:'The Pinch',        climb_colour:'Pink',   climb_grade:7, wall_name:'Crimp Wall', points_value:180, my_send:null },
  { id:3, climb_name:'Dyno or die',      climb_colour:'Yellow', climb_grade:9, wall_name:'The Slab',   points_value:240, my_send:null },
  { id:4, climb_name:'Heel hook heaven', climb_colour:'Green',  climb_grade:4, wall_name:'Crimp Wall', points_value:90,  my_send:{ attempts:2 } },
];

const COMP_LEADERBOARD = [
  { user_id:1, username:'sashaT',      rank:1, points:540, climbs_completed:5, total_attempts:9,  advances:true },
  { user_id:2, username:'mxbeta',      rank:2, points:420, climbs_completed:4, total_attempts:11, advances:true },
  { user_id:7, username:'you',         rank:3, points:210, climbs_completed:2, total_attempts:6,  advances:true },
  { user_id:3, username:'leah_climbs', rank:4, points:180, climbs_completed:2, total_attempts:8,  advances:false },
];

Object.assign(window, { GYMS, WALLS, CLIMBS, REVIEWS, LEADERBOARD, ME, COMPETITIONS, COMP_CLIMBS, COMP_LEADERBOARD });
