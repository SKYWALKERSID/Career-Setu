-- Connect the existing seeded courses and opportunities to canonical skills.
-- These rows are catalog relationships only; no courses or opportunities are
-- created here, and the inserts are safe to rerun.
WITH mappings(title, skill_name) AS (
  VALUES
    ('Data Structures and Algorithms', 'Data Structures & Algorithms'),
    ('Full Stack Web Development', 'HTML/CSS'), ('Full Stack Web Development', 'JavaScript'), ('Full Stack Web Development', 'React'), ('Full Stack Web Development', 'Node.js'), ('Full Stack Web Development', 'REST API Development'),
    ('Cloud Computing Fundamentals', 'AWS Cloud Fundamentals'),
    ('Google Data Analytics Professional Certificate', 'SQL'), ('Google Data Analytics Professional Certificate', 'Excel & Advanced Formulas'), ('Google Data Analytics Professional Certificate', 'Pandas & NumPy'), ('Google Data Analytics Professional Certificate', 'Statistics & Probability'),
    ('Meta Front-End Developer Certificate', 'HTML/CSS'), ('Meta Front-End Developer Certificate', 'JavaScript'), ('Meta Front-End Developer Certificate', 'React'),
    ('Cisco CCNA Networking Basics', 'Network Security'),
    ('CompTIA Security+ Exam Prep', 'Cybersecurity Fundamentals'), ('CompTIA Security+ Exam Prep', 'Penetration Testing'),
    ('Machine Learning by Andrew Ng', 'Python'), ('Machine Learning by Andrew Ng', 'Machine Learning Basics'), ('Machine Learning by Andrew Ng', 'Statistics & Probability'),
    ('PostgreSQL Bootcamp & Administration', 'PostgreSQL Database'), ('PostgreSQL Bootcamp & Administration', 'Database Administration'), ('PostgreSQL Bootcamp & Administration', 'SQL'),
    ('UI/UX Design Essentials in Figma', 'Figma & UI Design'), ('UI/UX Design Essentials in Figma', 'User Research & Wireframing'),
    ('Python for Data Science', 'Python'), ('Python for Data Science', 'Pandas & NumPy'),
    ('Cybersecurity Fundamentals & Ethical Hacking', 'Cybersecurity Fundamentals'), ('Cybersecurity Fundamentals & Ethical Hacking', 'Network Security'), ('Cybersecurity Fundamentals & Ethical Hacking', 'Penetration Testing'),
    ('DevOps & Kubernetes Masterclass', 'Docker & Containers'), ('DevOps & Kubernetes Masterclass', 'Kubernetes'), ('DevOps & Kubernetes Masterclass', 'CI/CD Pipelines'),
    ('Embedded Systems & Microcontrollers', 'Embedded C/C++'), ('Embedded Systems & Microcontrollers', 'Internet of Things (IoT)'),
    ('Product Management Fundamentals', 'Product Management'), ('Product Management Fundamentals', 'Agile & Scrum Methodologies'),
    ('Digital Marketing & Social Media Strategy', 'Digital Marketing & SEO'), ('Digital Marketing & Social Media Strategy', 'Content Strategy'),
    ('Java Programming & OOP Concepts', 'Java Programming'),
    ('System Design & High Scalability Architecture', 'System Design'),
    ('Business Analytics with Excel & PowerBI', 'Excel & Advanced Formulas'), ('Business Analytics with Excel & PowerBI', 'PowerBI'), ('Business Analytics with Excel & PowerBI', 'Business Analysis'),
    ('Agile & Scrum Project Management', 'Agile & Scrum Methodologies'), ('Agile & Scrum Project Management', 'Product Management'),
    ('Linux System Administration & Shell Scripting', 'Linux Administration'),
    ('Deep Learning & Neural Networks', 'Deep Learning & PyTorch'), ('Deep Learning & Neural Networks', 'Machine Learning Basics'),
    ('Rest API Design with Node & Express', 'REST API Development'), ('Rest API Design with Node & Express', 'Node.js'),
    ('Public Policy & E-Governance in India', 'Public Administration & E-Gov'),
    ('Effective Business Communication & Soft Skills', 'Communication Skills')
)
INSERT INTO public.course_skills (course_id, skill_id)
SELECT courses.id, skills.id
FROM mappings
JOIN public.courses AS courses ON courses.title = mappings.title
JOIN public.skills AS skills ON skills.name = mappings.skill_name
ON CONFLICT (course_id, skill_id) DO NOTHING;

WITH mappings(title, skill_name) AS (
  VALUES
    ('Software Engineering Intern', 'Python'), ('Software Engineering Intern', 'SQL'), ('Software Engineering Intern', 'REST API Development'), ('Software Engineering Intern', 'Git & Version Control'),
    ('Graduate Engineer Trainee (GET - IT)', 'Data Structures & Algorithms'), ('Graduate Engineer Trainee (GET - IT)', 'Problem Solving & Logic'),
    ('MP State IT & E-Governance Fellowship', 'Public Administration & E-Gov'), ('MP State IT & E-Governance Fellowship', 'Communication Skills'),
    ('Junior Data Analyst', 'SQL'), ('Junior Data Analyst', 'Excel & Advanced Formulas'), ('Junior Data Analyst', 'Python'), ('Junior Data Analyst', 'Pandas & NumPy'),
    ('Cybersecurity Associate Specialist', 'Cybersecurity Fundamentals'), ('Cybersecurity Associate Specialist', 'Network Security'), ('Cybersecurity Associate Specialist', 'Penetration Testing'),
    ('Associate Cloud Engineer (Demo Role)', 'AWS Cloud Fundamentals'), ('Associate Cloud Engineer (Demo Role)', 'Linux Administration'), ('Associate Cloud Engineer (Demo Role)', 'Docker & Containers'),
    ('UI/UX Design Apprentice (Demo Role)', 'Figma & UI Design'), ('UI/UX Design Apprentice (Demo Role)', 'User Research & Wireframing'),
    ('Junior Embedded Firmware Trainee (Demo Role)', 'Embedded C/C++'), ('Junior Embedded Firmware Trainee (Demo Role)', 'Internet of Things (IoT)'),
    ('Assistant Programmer (MP State Service Exam)', 'Java Programming'), ('Assistant Programmer (MP State Service Exam)', 'Data Structures & Algorithms'),
    ('Digital Marketing & Content Specialist (Demo Role)', 'Digital Marketing & SEO'), ('Digital Marketing & Content Specialist (Demo Role)', 'Content Strategy'),
    ('Python Backend Developer Intern (Demo Role)', 'Python'), ('Python Backend Developer Intern (Demo Role)', 'SQL'), ('Python Backend Developer Intern (Demo Role)', 'REST API Development'), ('Python Backend Developer Intern (Demo Role)', 'Git & Version Control'),
    ('Business Analyst Associate (Demo Role)', 'Business Analysis'), ('Business Analyst Associate (Demo Role)', 'Excel & Advanced Formulas'), ('Business Analyst Associate (Demo Role)', 'SQL'),
    ('QA Automation Engineer Trainee (Demo Role)', 'JavaScript'), ('QA Automation Engineer Trainee (Demo Role)', 'Python'), ('QA Automation Engineer Trainee (Demo Role)', 'REST API Development'),
    ('AI/ML Engineering Apprentice (Demo Role)', 'Python'), ('AI/ML Engineering Apprentice (Demo Role)', 'Pandas & NumPy'), ('AI/ML Engineering Apprentice (Demo Role)', 'Machine Learning Basics'),
    ('Network Systems Technician (Demo Role)', 'Network Security'), ('Network Systems Technician (Demo Role)', 'Linux Administration'), ('Network Systems Technician (Demo Role)', 'System Design')
)
INSERT INTO public.opportunity_skills (opportunity_id, skill_id)
SELECT opportunities.id, skills.id
FROM mappings
JOIN public.opportunities AS opportunities ON opportunities.title = mappings.title
JOIN public.skills AS skills ON skills.name = mappings.skill_name
ON CONFLICT (opportunity_id, skill_id) DO NOTHING;
