-- 봉래초등학교 총동문회 DB 설계 초안
-- 운영 전에는 Flyway 또는 Liquibase 마이그레이션으로 편입하고, ddl-auto는 validate로 전환한다.

-- 역할: SUPER_ADMIN > ADMIN > MEMBER > PENDING
-- PENDING: 가입 후 관리자 승인 대기 상태
-- MEMBER: 관리자가 승인한 일반 회원
-- ADMIN: 최고관리자가 지정한 관리자 (회원 승인/관리 권한)
-- SUPER_ADMIN: 최초 1명, 관리자 지정 및 모든 권한 보유

-- 01회 졸업연도 1927년, 이후 매년 +1 (99회 = 2026년)
-- 졸업연도 = 1926 + class_no

create table if not exists users (
    id bigserial primary key,
    username varchar(50) not null unique,
    password_hash varchar(100) not null,
    name varchar(50) not null,
    email varchar(120) not null unique,
    phone varchar(30),
    region_province varchar(50),           -- 거주 도 (예: 전라남도)
    region_city varchar(50),               -- 거주 시/군 (예: 고흥군)
    class_no integer,                      -- 졸업 기수 (1~99)
    graduation_year integer,               -- 졸업 연도 (= 1926 + class_no)
    role varchar(30) not null default 'PENDING',
    terms_agreed boolean not null default false,
    privacy_agreed boolean not null default false,
    sms_agreed boolean not null default false,
    email_agreed boolean not null default false,
    approved_by bigint references users(id),
    approved_at timestamp,
    enabled boolean not null default true,
    created_at timestamp not null default now(),
    updated_at timestamp
);

create table if not exists alumni_graduation_classes (
    id bigserial primary key,
    class_no varchar(30) not null unique,
    graduation_year integer,
    title varchar(100),
    manager_user_id bigint references users(id),
    created_at timestamp not null default now()
);

-- 확장 프로필: 기본 정보는 users 테이블에, 추가/공개 설정만 여기에 보관
create table if not exists alumni_profiles (
    id bigserial primary key,
    user_id bigint not null unique references users(id) on delete cascade,
    occupation varchar(120),
    public_profile boolean not null default false,
    memo text,
    created_at timestamp not null default now(),
    updated_at timestamp
);

create table if not exists executives (
    id bigserial primary key,
    role_name varchar(50) not null,
    name varchar(50) not null,
    class_no varchar(30),
    term_start date,
    term_end date,
    display_order integer not null default 0,
    is_current boolean not null default true,
    profile_image_file_id bigint,
    created_at timestamp not null default now()
);

create table if not exists rules (
    id bigserial primary key,
    chapter varchar(100),
    article_no varchar(30),
    title varchar(200) not null,
    body text not null,
    effective_date date,
    display_order integer not null default 0,
    created_at timestamp not null default now()
);

create table if not exists school_histories (
    id bigserial primary key,
    event_date varchar(30) not null,
    summary varchar(300) not null,
    note varchar(300),
    display_order integer not null default 0
);

create table if not exists school_symbols (
    id bigserial primary key,
    symbol_type varchar(40) not null,
    name varchar(80) not null,
    description text,
    image_file_id bigint,
    display_order integer not null default 0
);

create table if not exists boards (
    id bigserial primary key,
    code varchar(50) not null unique,
    name varchar(100) not null,
    category varchar(50) not null,
    read_role varchar(30) not null default 'GUEST',
    write_role varchar(30) not null default 'ALUMNI_MEMBER',
    use_comment boolean not null default true,
    use_attachment boolean not null default true,
    display_order integer not null default 0
);

create table if not exists posts (
    id bigserial primary key,
    board_id bigint not null references boards(id),
    author_id bigint references users(id),
    title varchar(250) not null,
    content text not null,
    notice boolean not null default false,
    view_count bigint not null default 0,
    published boolean not null default true,
    created_at timestamp not null default now(),
    updated_at timestamp
);

create table if not exists comments (
    id bigserial primary key,
    post_id bigint not null references posts(id) on delete cascade,
    author_id bigint references users(id),
    parent_id bigint references comments(id),
    content text not null,
    deleted boolean not null default false,
    created_at timestamp not null default now(),
    updated_at timestamp
);

create table if not exists files (
    id bigserial primary key,
    owner_type varchar(50) not null,
    owner_id bigint,
    original_name varchar(255) not null,
    stored_name varchar(255) not null,
    content_type varchar(120),
    file_size bigint not null default 0,
    public_access boolean not null default false,
    uploaded_by bigint references users(id),
    created_at timestamp not null default now()
);

alter table executives
    add constraint executives_profile_image_fk
    foreign key (profile_image_file_id) references files(id);

alter table school_symbols
    add constraint school_symbols_image_fk
    foreign key (image_file_id) references files(id);

create table if not exists donations (
    id bigserial primary key,
    donor_user_id bigint references users(id),
    donor_name varchar(80),
    amount numeric(14, 0) not null,
    donation_type varchar(50) not null,
    paid_at date,
    public_display boolean not null default false,
    memo text,
    created_at timestamp not null default now()
);

create table if not exists scholarships (
    id bigserial primary key,
    title varchar(200) not null,
    recipient_name varchar(80),
    amount numeric(14, 0),
    awarded_at date,
    description text,
    public_display boolean not null default true,
    created_at timestamp not null default now()
);

create table if not exists events (
    id bigserial primary key,
    title varchar(200) not null,
    event_start timestamp,
    event_end timestamp,
    location varchar(200),
    description text,
    board_post_id bigint references posts(id),
    created_at timestamp not null default now()
);

create table if not exists audit_logs (
    id bigserial primary key,
    actor_id bigint references users(id),
    action varchar(80) not null,
    target_type varchar(80),
    target_id bigint,
    ip_address varchar(80),
    detail text,
    created_at timestamp not null default now()
);

-- 동문 검색용 기존 동문 명단 (회원 가입과 별개로 관리자가 일괄 업로드)
-- 이름 + 기수로 검색 가능 (회원 전용)
create table if not exists alumni_directory (
    id bigserial primary key,
    name varchar(50) not null,
    class_no integer not null,           -- 졸업 기수
    graduation_year integer,             -- 졸업 연도 (= 1926 + class_no)
    region varchar(80),                  -- 사는 지역 (선택)
    created_at timestamp not null default now()
);

create index if not exists idx_alumni_directory_name on alumni_directory (name);
create index if not exists idx_alumni_directory_class_no on alumni_directory (class_no);
