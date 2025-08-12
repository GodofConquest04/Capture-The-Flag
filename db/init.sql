CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255),
    password VARCHAR(255)
);

CREATE TABLE flags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    flag TEXT
);

INSERT INTO users (username, password) VALUES
('admin', 'mP$@7jR4!XcZq1'),
('user', 'user'),
('abhinav', 'Qw9^zM4t!pLr8#'),
('shivansh', 'Tg7!oB$2nM9@xL'),
('bobby', 'Vr3@hY7%qJz2$k'),
('sudharshan', 'Lf5&uR9!oP1^wT');

INSERT INTO flags (flag) VALUES ('SelfmadeNinja{sequel_1nj3ct1on_1s_3@sy}');
