--
-- PostgreSQL database dump
--

-- Dumped from database version 16.10 (Debian 16.10-1.pgdg13+1)
-- Dumped by pg_dump version 17.5

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: Account; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Account" (
    id text NOT NULL,
    "userId" text NOT NULL,
    type text NOT NULL,
    provider text NOT NULL,
    "providerAccountId" text NOT NULL,
    refresh_token text,
    access_token text,
    expires_at integer,
    token_type text,
    scope text,
    id_token text,
    session_state text,
    role text DEFAULT 'client'::text NOT NULL
);


ALTER TABLE public."Account" OWNER TO postgres;

--
-- Name: Attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Attendance" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "checkInTime" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "checkOutTime" timestamp(3) without time zone,
    type text DEFAULT 'gym'::text NOT NULL,
    channel text DEFAULT 'unknown'::text NOT NULL,
    "stationId" text,
    "createdAt" timestamp(3) without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    duration integer
);


ALTER TABLE public."Attendance" OWNER TO postgres;

--
-- Name: ClientProfile; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."ClientProfile" (
    profile_plan text,
    profile_start_date timestamp(3) without time zone,
    profile_end_date timestamp(3) without time zone,
    profile_emergency_phone text,
    profile_phone text,
    user_id text NOT NULL,
    profile_id text NOT NULL,
    profile_address text DEFAULT ''::text,
    profile_social text DEFAULT ''::text,
    profile_first_name text,
    profile_last_name text
);


ALTER TABLE public."ClientProfile" OWNER TO postgres;

--
-- Name: Gallery; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Gallery" (
    id text NOT NULL,
    "imageUrl" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Gallery" OWNER TO postgres;

--
-- Name: InventoryItem; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."InventoryItem" (
    item_id text NOT NULL,
    item_name text NOT NULL,
    item_description text NOT NULL,
    item_price double precision NOT NULL,
    item_discount double precision,
    item_stock integer NOT NULL,
    item_image_url text NOT NULL,
    item_created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    item_updated_at timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."InventoryItem" OWNER TO postgres;

--
-- Name: MembershipPlan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."MembershipPlan" (
    membership_id integer NOT NULL,
    membership_type text NOT NULL,
    membership_cost double precision NOT NULL,
    membership_features text[],
    membership_created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    membership_duration integer NOT NULL
);


ALTER TABLE public."MembershipPlan" OWNER TO postgres;

--
-- Name: MembershipPlan_membership_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."MembershipPlan_membership_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."MembershipPlan_membership_id_seq" OWNER TO postgres;

--
-- Name: MembershipPlan_membership_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."MembershipPlan_membership_id_seq" OWNED BY public."MembershipPlan".membership_id;


--
-- Name: PaymentRecord; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PaymentRecord" (
    payment_id integer NOT NULL,
    payer_user_id text NOT NULL,
    payment_amount double precision NOT NULL,
    payment_method text NOT NULL,
    payment_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PaymentRecord" OWNER TO postgres;

--
-- Name: PaymentRecord_payment_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."PaymentRecord_payment_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."PaymentRecord_payment_id_seq" OWNER TO postgres;

--
-- Name: PaymentRecord_payment_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."PaymentRecord_payment_id_seq" OWNED BY public."PaymentRecord".payment_id;


--
-- Name: Plan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Plan" (
    id text NOT NULL,
    name text NOT NULL,
    price double precision NOT NULL,
    description text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    slug text NOT NULL
);


ALTER TABLE public."Plan" OWNER TO postgres;

--
-- Name: Purchase; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Purchase" (
    id text NOT NULL,
    purchase_quantity integer NOT NULL,
    purchase_total double precision NOT NULL,
    purchase_date timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "customerId" text NOT NULL,
    "productId" text NOT NULL
);


ALTER TABLE public."Purchase" OWNER TO postgres;

--
-- Name: Session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    "sessionToken" text NOT NULL,
    "userId" text NOT NULL,
    expires timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Session" OWNER TO postgres;

--
-- Name: Story; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Story" (
    id text NOT NULL,
    title text NOT NULL,
    content text DEFAULT ''::text NOT NULL,
    "imageUrl" text NOT NULL,
    link text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Story" OWNER TO postgres;

--
-- Name: UserContact; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserContact" (
    contact_id integer NOT NULL,
    contact_user_id text NOT NULL,
    contact_message text NOT NULL,
    contact_created timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserContact" OWNER TO postgres;

--
-- Name: UserContact_contact_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public."UserContact_contact_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public."UserContact_contact_id_seq" OWNER TO postgres;

--
-- Name: UserContact_contact_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public."UserContact_contact_id_seq" OWNED BY public."UserContact".contact_id;


--
-- Name: UserMembershipPlan; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."UserMembershipPlan" (
    "userId" text NOT NULL,
    "membershipId" integer NOT NULL,
    "assignedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."UserMembershipPlan" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Name: fingerprints; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.fingerprints (
    id text NOT NULL,
    "userId" text NOT NULL,
    template bytea NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public.fingerprints OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id text NOT NULL,
    "phoneNumber" text NOT NULL,
    image text,
    role text DEFAULT 'client'::text NOT NULL,
    password text,
    "otpCode" text,
    "twoFASecret" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL,
    "lastName" text DEFAULT ''::text NOT NULL,
    username text NOT NULL,
    "firstName" text DEFAULT 'Sin nombre'::text NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: MembershipPlan membership_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipPlan" ALTER COLUMN membership_id SET DEFAULT nextval('public."MembershipPlan_membership_id_seq"'::regclass);


--
-- Name: PaymentRecord payment_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentRecord" ALTER COLUMN payment_id SET DEFAULT nextval('public."PaymentRecord_payment_id_seq"'::regclass);


--
-- Name: UserContact contact_id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserContact" ALTER COLUMN contact_id SET DEFAULT nextval('public."UserContact_contact_id_seq"'::regclass);


--
-- Data for Name: Account; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Account" (id, "userId", type, provider, "providerAccountId", refresh_token, access_token, expires_at, token_type, scope, id_token, session_state, role) FROM stdin;
\.


--
-- Data for Name: Attendance; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Attendance" (id, "userId", "checkInTime", "checkOutTime", type, channel, "stationId", "createdAt", "updatedAt", duration) FROM stdin;
6cf8fa42-d425-4953-991f-b6d2292b5245	cm9d6f9dn0000l1046fjqc0fq	2025-04-11 19:40:36.554	\N	gym	unknown	\N	2025-09-02 05:25:05.879	2025-09-02 05:25:05.879	\N
62483646-b54f-464c-87a3-765695f5a521	cm9et2l970000ju04lh4wwkti	2025-04-12 22:50:31.239	\N	gym	unknown	\N	2025-09-02 05:25:05.879	2025-09-02 05:25:05.879	\N
5758a433-61b6-4330-83c8-ebb83dfb342b	cm9et2l970000ju04lh4wwkti	2025-09-01 14:27:40.069	2025-09-01 16:21:57.403	gym	unknown	\N	2025-09-02 05:25:05.879	2025-09-02 05:25:05.879	\N
369fb0f9-4b3a-4439-ac8a-b5ba846bc5cb	cm9d6f9dn0000l1046fjqc0fq	2025-09-01 14:35:44.309	2025-09-01 16:22:06.334	gym	unknown	\N	2025-09-02 05:25:05.879	2025-09-02 05:25:05.879	\N
c287ad0e-99ab-4966-8f38-faeec78886c0	cm9d6f9dn0000l1046fjqc0fq	2025-09-01 02:31:58.787	2025-09-02 03:50:01.008	gym	unknown	\N	2025-09-02 05:25:05.879	2025-09-02 05:25:05.879	\N
5d825930-8ef4-474d-8851-0ed00a492f29	cm9et2l970000ju04lh4wwkti	2025-09-01 02:32:32.082	2025-09-02 03:50:01.008	gym	unknown	\N	2025-09-02 05:25:05.879	2025-09-02 05:25:05.879	\N
83377ef2-397b-4598-88d0-e1a6653387db	cm9et2l970000ju04lh4wwkti	2025-09-01 16:26:25.996	2025-09-02 03:50:01.008	gym	unknown	\N	2025-09-02 05:25:05.879	2025-09-03 10:20:55.762	\N
8a23ddfb-0ff4-4e04-87d1-b2fd82ef19ee	cmf5x93aq0000jp04aevovgqt	2025-09-06 21:50:53.784	2025-09-07 03:39:55.059	gym	unknown	\N	2025-09-06 21:50:53.785	2025-09-06 21:50:53.785	\N
ce1f49e1-d9e7-4e7d-826a-b47177271f9b	cmf8tpuq90000l504rwbstrop	2025-09-06 22:17:43.469	2025-09-07 03:39:55.059	gym	unknown	\N	2025-09-06 22:17:43.47	2025-09-06 22:17:43.47	\N
d5c7bfec-3e26-46d4-b40c-400ff4c6cbd9	cmf22mbmd0000ju042uz9fcje	2025-09-07 20:30:52.31	2025-09-07 22:59:56.21	gym	unknown	\N	2025-09-07 20:30:52.311	2025-09-07 22:59:56.211	149
84d09da4-9647-4412-82e6-575b14c5eba7	cmf22mbmd0000ju042uz9fcje	2025-09-08 15:08:35.573	2025-09-08 15:54:02.594	gym	unknown	\N	2025-09-08 15:08:35.574	2025-09-08 15:54:02.596	45
b49663cd-0f48-4aba-aae7-f27bfc47ee47	cmf22rtu40000jv04968dy77m	2025-09-08 15:04:47.837	2025-09-09 04:00:01.08	gym	unknown	\N	2025-09-08 15:04:47.838	2025-09-08 15:04:47.838	\N
b34cb2f1-a29b-40f5-a526-363e9621d3a2	cm9d6ki6s0000l504trp6z0nw	2025-09-08 23:56:49.046	2025-09-09 04:00:01.08	gym	unknown	\N	2025-09-08 23:56:49.047	2025-09-08 23:56:49.047	\N
7a3fbba0-b456-4e87-8c6a-70613ff53f7d	cmf5x93aq0000jp04aevovgqt	2025-09-09 20:40:14.12	2025-09-09 20:42:00.568	gym	unknown	\N	2025-09-09 20:40:14.121	2025-09-09 20:42:00.569	2
6186915f-f530-4591-b5a6-b7f73099809c	cm9d6f9dn0000l1046fjqc0fq	2025-09-15 18:11:15.074	\N	gym	unknown	\N	2025-09-15 18:11:15.075	2025-09-15 18:11:15.075	\N
4ed753d7-7341-4e67-bee3-bcc299feb4fd	cmf5pguev0000l504ub28jfy2	2025-09-15 18:19:42.138	\N	gym	unknown	\N	2025-09-15 18:19:42.139	2025-09-15 18:19:42.139	\N
f77b6bf2-ba30-424c-bc99-fe2be25871d8	cmfbrcjbo0000i8040eq4nin9	2025-09-15 20:37:17.626	\N	gym	unknown	\N	2025-09-15 20:37:17.627	2025-09-15 20:37:17.627	\N
\.


--
-- Data for Name: ClientProfile; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."ClientProfile" (profile_plan, profile_start_date, profile_end_date, profile_emergency_phone, profile_phone, user_id, profile_id, profile_address, profile_social, profile_first_name, profile_last_name) FROM stdin;
Mensual	2025-08-25 00:00:00	2025-09-25 00:00:00		+51922099932	cmfbd6y3z0000js048ujzb5t1	cmfbd6y7m0001js04mxyxt6ok	\N	archer04v	ANTONY	SAIRITUPAC VENTURA
Mensual	2025-09-05 00:00:00	2025-11-05 00:00:00	\N	+51971186650	cmfbuoky00000l804oa6dy9nx	cmfbuon100001l804amff3780	\N	\N	MIA	QUIROZ CAPALI
Mensual	2025-09-08 00:00:00	2025-12-08 00:00:00	\N	+51921954552	cmfbuwj2n0002l804iz64u3u8	cmfbuwnr00003l804f2of5otp	\N	\N	GIOVANNY	TORREALVA DAVILA
Mensual	2025-09-08 00:00:00	2025-10-08 00:00:00		+51966750309	cmfbv9wax0000jx04sqxnlwff	cmfbva1o90001jx045ei8rr1r	\N	\N	JESUS	PACHECO
\N	\N	\N	\N	955216619	cmfbwhpuu0000if0474pu3jqt	cmfbwhpuu0001if04scv8ccs3			Jefferson010101	Calderon
Pro	2025-04-11 00:00:00	2025-07-10 00:00:00		971474484	cm9d6f9dn0000l1046fjqc0fq	cm9d6f9dn0001l104bcanmalr			edudk20@gmail.com	cuya conislla
Mensual	2025-04-12 00:00:00	2025-05-12 00:00:00	\N	+51957107417	cm9et2l970000ju04lh4wwkti	cm9et2lci0001ju04840iu0no	\N	\N	FABRIZIO	CALVERA HERRERA
\N	\N	\N	\N	948930779	cmevqj6dm0000um24ae4fxx35	cmevqj6dm0001um24eqfmo696			Luis	Astonitas
Mensual	2025-09-01 00:00:00	2025-10-01 00:00:00	\N	+51986363462	cmf22mbmd0000ju042uz9fcje	cmf22mbq00001ju04jjmwifvs	\N	\N	Nicole	Ramirez Uscata
Elite	2025-09-04 00:00:00	2026-09-04 00:00:00	\N	+51921647254	cmf5pguev0000l504ub28jfy2	cmf5pgv3h0001l5045xmv8epz	\N	\N	Diego	Gutierez
Mensual	2025-08-27 00:00:00	2026-08-27 00:00:00	\N	+51972809800	cmf5x93aq0000jp04aevovgqt	cmf5x93eq0001jp04qrhifyah	La Paz 389	\N	Edgar	Rios
Mensual	2025-09-01 00:00:00	2025-10-01 00:00:00	\N	+51993288744	cmf8rspbt0000jl04s96fvg5r	cmf8rspk60001jl0415v2ndvs	\N	\N	Bryan Fernando	Cruz
Mensual	2025-09-06 00:00:00	2025-10-06 00:00:00		+51901748650	cmf8tpuq90000l504rwbstrop	cmf8tpuu90001l5044kabkfu4	\N	\N	Josemaria	Perez Palomino
Mensual	2025-09-03 00:00:00	2025-10-03 00:00:00	987654321	986363462	cmf22rtu40000jv04968dy77m	cmf22rtu40001jv04eoc5wbjx			Nicole	Ramirez
Mensual	2025-08-12 00:00:00	2025-11-12 00:00:00	\N	+51961330570	cmfb9ky7p0000l804w07dvexa	cmfb9kybj0001l8046ayhdq35	\N	\N	LISBELL	ALFARO LEON
Mensual	2025-09-01 00:00:00	2025-10-01 00:00:00	\N	+51971904844	cmfba5c520000lb045eqnlf8o	cmfba5c940001lb04ejhwxj7d	\N	\N	NATALY	CAPALI
Mensual	2025-09-01 00:00:00	2025-10-01 00:00:00	\N	+51949397406	cmfba7p490000l804pcssef9c	cmfba7qvu0001l8043o8qpanj	\N	\N	ELVIA	CAPALI
Mensual	2025-09-01 00:00:00	2025-10-01 00:00:00	\N	+51925927516	cmfba9awb0000k8043y6uhtd6	cmfba9b0d0001k8045k41kc8j	\N	\N	EVELYN	CAPALI
Mensual	2024-12-12 00:00:00	2025-12-12 00:00:00	\N	+51983091079	cmfbacshk0000ky04v36ch7f3	cmfbacsls0001ky04yaifhnff	\N	\N	ENEIDA	TORO ALVARADO
Mensual	2025-09-01 00:00:00	2025-10-01 00:00:00	\N	+51934999014	cmfbajbhk0000lg04c164dd1u	cmfbajbm00001lg04w18xsckz	\N	\N	GAEL	ARNAO
Mensual	2025-09-01 00:00:00	2025-10-01 00:00:00	\N	+51933039187	cmfbb0bnb0000jr04fioiezjn	cmfbb0bt60001jr04b3qmtbox	\N	\N	JULIO	CORDERO
Mensual	2025-08-25 00:00:00	2025-09-25 00:00:00	\N	+51920124026	cmfbd2c6y0000jo04ix3aaf6e	cmfbd2cbi0001jo0432rh0bup	\N	vigilantenight1	FRANK	PILLACA BENDEZU
Pro	2025-09-08 00:00:00	2025-12-07 00:00:00	\N	+51918701454	cmfboep270000l4041phuts7m	cmfboeq1r0001l4049pb3awms	\N	\N	JHAQUELIN	QUISPE SARMIENTO
Mensual	2025-07-16 00:00:00	2025-12-31 00:00:00	\N	+51970698400	cmfbpnd2l0000js041pal79yh	cmfbpnd6v0001js04kw8p5ch7	\N	\N	LADY	CONDORI CISNEROS
Mensual	2025-09-08 00:00:00	2025-10-08 00:00:00	\N	+51914430506	cmfbrcjbo0000i8040eq4nin9	cmfbrckbw0001i804aj9u38qy	\N	\N	DEYVIS	NAVENTA TUEROS
Mensual	2025-08-22 00:00:00	2025-09-22 00:00:00	\N	+51935351000	cmfbtwpcb0000ky04412bgjra	cmfbtwpwi0001ky043th4msge	\N	\N	ALEJANDRO	NARAZA GUIDICHE
Mensual	2025-08-27 00:00:00	2026-01-27 00:00:00		972809800	cm9d6ki6s0000l504trp6z0nw	cm9d6kia30001l50408au9igu	\N	\N	EDGAR	SUAREZ GRANDEZ
Mensual	2025-07-21 00:00:00	2025-10-21 00:00:00	\N	+51934809122	cmfbu50710000kz04o65818b3	cmfbu54gt0001kz048jc81qbd	\N	\N	SOLEDAD	RUPIRE SARMIENTO
Mensual	2025-08-21 00:00:00	2025-09-21 00:00:00	\N	+51988064436	cmfbu92m60000l704swhn1v5i	cmfbu94b00001l704ft18q4q1	\N	\N	MARILIN	QUISPE CARHUAS
\.


--
-- Data for Name: Gallery; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Gallery" (id, "imageUrl", "createdAt") FROM stdin;
cmfa9nbq80002wg5slhzwohdw	https://wolf-gym.s3.us-east-1.amazonaws.com/uploads/2025/9/7/19d56e38-e90d-4145-a2cb-e96a0cf63e9d-bcfa7258a67082fc71fba1193f85a0bb.jpeg	2025-09-07 22:30:10.515
cmfa9nmhq0003wg5sudphyd71	https://wolf-gym.s3.us-east-1.amazonaws.com/uploads/2025/9/7/3b38f549-6c73-44cc-a71f-c731adb8246d-e440aca1ad811e295af5e4192ac4ff72.jpeg	2025-09-07 22:30:25.695
cmfa9pt1n0005wg5sgrac99yf	https://wolf-gym.s3.us-east-1.amazonaws.com/uploads/2025/9/7/42c9c635-567e-42ad-b02d-08cecefced04-6_SmartFit_Fuerza.jpg	2025-09-07 22:32:07.336
cmfa9qp4v0006wg5sr54o40ni	https://wolf-gym.s3.us-east-1.amazonaws.com/uploads/2025/9/7/7e382137-5e4f-4458-add3-a25fc46220d1-bicicletas_y_caminadoras_area.jpg	2025-09-07 22:32:48.921
cmfa9slnm0001l1046s66hgyp	https://wolf-gym.s3.us-east-1.amazonaws.com/uploads/2025/9/7/94934917-f9b8-4594-bab9-dbb67eb2bc5f-063_La_Victoria_Qro.jpg	2025-09-07 22:34:17.828
cmfa9tfod0007wg5shl2wtynb	https://wolf-gym.s3.us-east-1.amazonaws.com/uploads/2025/9/7/bbb25f87-3f68-4e95-9e73-7c6d07aa1e5c-bd920ec5946a74581757b1a96950fff0.jpeg	2025-09-07 22:34:55.518
\.


--
-- Data for Name: InventoryItem; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."InventoryItem" (item_id, item_name, item_description, item_price, item_discount, item_stock, item_image_url, item_created_at, item_updated_at) FROM stdin;
f977e352-28c4-447b-85e4-4a03a06ac9d1	Proteína Gold Standard WHEY	Proteína de 5L	129	0	2	https://wolf-gym.s3.us-east-1.amazonaws.com/uploads/5d2e4904-4441-40d3-8580-5fd4942ee8d0-images (1).jpeg	2025-09-07 22:38:40.935	2025-09-07 22:38:40.935
7d2fa37f-2235-48c1-b854-a744031ba616	Ultimate Nutrition Prostar 100%	Proteína Whey Protein	119.9	0	10	https://wolf-gym.s3.us-east-1.amazonaws.com/uploads/d70ebe53-382c-4ae8-8c23-5997fd45b2eb-unnamed_3_1280x.jpg	2025-09-07 22:40:58.133	2025-09-07 22:41:48.81
5e602c25-1100-4c41-95c9-43b290ef1304	Forzagen Galletas Proteicas 	Proteína	15	0	20	https://wolf-gym.s3.us-east-1.amazonaws.com/uploads/84263d9c-ee1d-44da-b847-4df147fd2d10-images (2).jpeg	2025-09-07 22:43:31.644	2025-09-07 22:43:31.644
\.


--
-- Data for Name: MembershipPlan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."MembershipPlan" (membership_id, membership_type, membership_cost, membership_features, membership_created, membership_duration) FROM stdin;
\.


--
-- Data for Name: PaymentRecord; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PaymentRecord" (payment_id, payer_user_id, payment_amount, payment_method, payment_date) FROM stdin;
\.


--
-- Data for Name: Plan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Plan" (id, name, price, description, "createdAt", slug) FROM stdin;
cm9gg6xr90003ume86qooiwzr	Plan Elite	350	Acceso ilimitado y entrenamiento personalizado - Por año	2025-04-14 02:21:47.493	plan-elite
cm9gfmjnj0000um3on41bws0x	Plan Mensual	60	Acceso ilimitado al gimnasio - Por Mes	2025-04-14 02:05:56.095	plan-mensual
cm9gg6xr90001ume855rds7mn	Plan Completo	75	Full Body + Baile + Aceso ilimitado al gimnasio - Por mes. 	2025-04-14 02:21:47.493	plan-basico
cm9gg6xr90002ume84ttmmrdl	Plan Pro	130	Entrenamiento personalizado - Por 3 meses	2025-04-14 02:21:47.493	plan-pro
\.


--
-- Data for Name: Purchase; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Purchase" (id, purchase_quantity, purchase_total, purchase_date, "customerId", "productId") FROM stdin;
\.


--
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Session" (id, "sessionToken", "userId", expires) FROM stdin;
\.


--
-- Data for Name: Story; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Story" (id, title, content, "imageUrl", link, "createdAt") FROM stdin;
\.


--
-- Data for Name: UserContact; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserContact" (contact_id, contact_user_id, contact_message, contact_created) FROM stdin;
\.


--
-- Data for Name: UserMembershipPlan; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."UserMembershipPlan" ("userId", "membershipId", "assignedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
467bff02-3169-457e-844e-fac22993a68a	3bc97809b923e7d7e16e45157f8772a24da050c1be0dd8c09c68a525f4cc30be	2025-04-05 03:22:05.759012+00	20250312043441_initial	\N	\N	2025-04-05 03:22:04.897034+00	1
c05e9da7-22a0-41d7-bd23-e9fdf5cf3eb9	d20dad09e538498eae6813fb31d80b73d91dbd8086a8f21cf7f11695cbc1a0f6	2025-04-05 03:22:06.823768+00	20250313165523_initial	\N	\N	2025-04-05 03:22:06.059745+00	1
915b9bae-7268-4585-b391-462fd98a1a00	d3127edc42984ed20fba838a68c46d721134520d9da50a5d42fa7219c285d362	2025-04-05 03:22:07.885867+00	20250314010209_add_username	\N	\N	2025-04-05 03:22:07.125634+00	1
e511630e-59d4-4151-bdda-d3a1cc942109	7b7cb3d2520160e871b4c16c6c97c53f7a980c5c52bfd249370817b2c9d3de04	2025-04-05 03:22:08.938283+00	20250314010647_add_username	\N	\N	2025-04-05 03:22:08.188156+00	1
1e09d753-faa8-482d-a480-ca6d0248dbb3	7d9e173f4d0486d5aa522aeb72ab0827e6fe83398d739e0c5dff56e16e156659	2025-04-05 03:22:10.011108+00	20250314021731_fix_relationship	\N	\N	2025-04-05 03:22:09.257947+00	1
2f1c19b3-4ea1-430e-86fa-3e729f8b7283	865104a9810dfedf7c603f264edba1d278e3d87801a0b16de2bdb523750da41e	2025-04-05 03:22:11.065501+00	20250314043846_new_camp	\N	\N	2025-04-05 03:22:10.314128+00	1
e7b8c734-62e8-4ab4-96d6-2dd806bfad69	fdedc2592bdc325062a75954c40f0827f2c4100221fcd928ef6291e0b36bd237	2025-04-05 03:22:12.131103+00	20250314050126_	\N	\N	2025-04-05 03:22:11.376936+00	1
478e68df-7973-4494-af9a-d21644d1e758	a4499b2cf2e5bc1ecbcdee78855363fe63188be8f4c63a5037860e9bd42690d8	2025-04-05 03:22:13.203898+00	20250404040113_add_camp_in_table_plans	\N	\N	2025-04-05 03:22:12.430271+00	1
72ae1936-c5d2-4410-9023-7eda99ca5793	74d10f1820b5f40198461d5f1c0c6dcc276a0a805a739f13f5af5accd98a5262	2025-04-14 01:13:26.05311+00	20250414011324_	\N	\N	2025-04-14 01:13:25.304065+00	1
0ea07377-0548-4ddd-839b-44dd754d6422	cd53ba988829b828ced0f17e86bfb46974687348b1212bd3bf92f2972d4de6ac	2025-04-14 04:41:06.194649+00	20250414044104_add_checkout_to_attendance	\N	\N	2025-04-14 04:41:05.343742+00	1
0fa38f8b-244b-40ed-920a-3778690c5f4b	50c8a4bf69c21b7642610ece83a72b232be75b40435996988e5eb8d32aec8b9b	2025-04-14 04:45:13.044836+00	20250414044511_add_checkout_to_attendance2	\N	\N	2025-04-14 04:45:12.17909+00	1
739cf2b3-48ae-491d-a18d-8ccbab29d6a4	879421da1da6e0164edbaffb92ebb7f2e63c6eceafa613e422fc435f5035bce3	2025-09-02 05:25:06.063017+00	20250902_attendance_patch	\N	\N	2025-09-02 05:25:05.680565+00	1
\.


--
-- Data for Name: fingerprints; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.fingerprints (id, "userId", template, "createdAt", "updatedAt") FROM stdin;
45e9beff-4c76-427b-99f9-920fd51cd97a	cm9et2l970000ju04lh4wwkti	\\x4b9553533231000002d6d70408050709ced000002ed77601000055827b12b4d6c000ea646f0079006fb2aa00170163619700c1d6ed3df90064002f64fcd64e01f24fc5005800e5b77700dc00e864ae009bd66864590080002340c3d64301e15eb200e000ddeddd00e700ee6461007cd6e764fb008e003764b2d64c00e1590001f901ec86d70063015d64af06b9284e078a804e8417054952fe77c37f8e806b076d52d7fb270bf7079005fc411a13eafe3a0356f650aa33ff5383be8493fd6daac37ccf7be3ff0f864d56aaf3e602ebfb06f735d0f68f470bba03a20509a94f0b070ef70ba706e92baefbd9fdf792d60fcca8136f0772abbfc62032d700dd19230b00641358174165590e00b1cb56c229fec136c064ffc800d4c161c0ffc25155870302191060c00600e2de6466170600ee1d605504fe0cd6f22762c0c04a04c05a8f0b01032764c19062fddd000d2e64c05bae3908d6af2b5e575b68d50116ef68c1c1515b589807025d1c562f4c1601df436b167ac0c0c053c007fe76284504011f4d6905c00ed6ad5360c0ffc005c0fcb3c212012a5671044976295cc14ac10a01ee607214ff78c1421101e26e6f29c364447ec1fef80403fd796d5208009f4667c31661c003005485a2ff08d71e8a76c2fcc505ff72dc00219577746a04fd07d66b9871c26414c4289da15d7456c05b5ba10a129a03f06dc0c1c0ae0602bd9c624aff1301e4aa768fc1c25864c0ff98c116d72bb3776bc1c104c0c3875355ff13011f05715016c2ffc0c22f7b054607d670bf60fd5f06c420c8a650c206011cd7b2c1c2bd050070df695ad7011834766fffc176763ac060c70017ed77c0c3a1c1c31752ffc15c0c0012ee6516c3fe4ec13f10c415f7a27f706dffc0c19e0903c1fc707074c109d4180ba67973ff0c1113d270c18cc152710810a8dc625916640b111a217007c0c3165a790410fc41a28404c6bc4662c07304d5f856b67d0511175570490413cb6074a0524200ce4303d6010b4552	2025-08-31 02:56:12.287	2025-09-01 14:45:21.884
3f7e5ca0-cd63-418d-94b4-d5f80e65314e	cm9d6f9dn0000l1046fjqc0fq	\\x4a335353323100000370770408050709ced000002f717601000042839d204d70aa00386442006a0036144e00d100aa64f300b57034642700a10096649c70aa002f647f00360054141c00db002964f0000e71086468004200c94f99701c015d6477006c0037145a00d000ba649c00d870866440008e00ac644570780005645e00ab008614b100b200aa456c00ec7043647400460049505d70410083532a00d90190145300c500b66482009d701b647900d40095648870d10040648c00410026116c00f70069648400677007647c004d00d7445d701f017c64830084001646bd07f520818785ffb670181dd4f3a0f73c243670f0e739ff55238720159c6085d6fea6f364f1e178fb1932f753814222d2098b8f27e2fc8b45838a8ef21ccf09c3f79706cd8e23130c374413a804c3bf98dcadd2495020667d683002c99e6983ac8389f05b1f697d3f6c9a7bbd9fe3078fe4107f4583ea08057b09fa0e700c8df069a66f140ff1fc3832929414b0b1e5291173986988b8f18ee9161377f3898beea11115bee52319b2728b80be9f0c8b80fc067ad717967787e90404e2f8e80bfe9fdfc9e52b0271cf152d03005cfd03fd73013e4103c005c57a4b7cfe4106007f4fd53ec37c013149fd4635053d0d702e52f7feffff3a40444b0a004763033304fec38d5304003f677ab20703136e10334405009e7085b2831800487b033a27fd8f46c0fefefffe3bfffd8ffefe331a1036f00692b1c3c0c389c37004c1c2b2c3c3c1c3c2c3c0008cf721ff3f1200134fedc28efcc1fe27304cf10c034e906bc18ec2c343c31370499a06fafcfd38c1f98cf9fcfcfdfd1dc1004ad2171b0a0073a261c2c0b3c3c3c2c2c004c527a427c3c406007aa9e8fffe48050075aa3746c10041db51b11200a3adec40448ffcc0fffdc0fd3a3a12709fae304a4b3238fec38dfcc2030044b3ffc40970b5b930c0432b3b0513c83d5cff350500fdba3eb3b50d008bd23a3bfffd5eff2efe0a00761350fc8cfcfe1bfe0900bed7408dc1fcfefbfeffcc0018ad35c3c2c4c1c45a1203a0d1b0c056c277acc0c00417001d67f4463b354545c1ffff53ff0bc5acf34d2a2eff3a040062f1454806007cf553fe38fd24750182f64ffffd38071366012079920810521e5db0fffffe370810591f505a4004102e210c551503399064ffa7c2a706c6aae2c5c1c6524200dc43027200004800b43fc501033e01d2b30000198052	2025-09-01 02:21:06.798	2025-09-01 02:21:06.798
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, "phoneNumber", image, role, password, "otpCode", "twoFASecret", "createdAt", "updatedAt", "lastName", username, "firstName") FROM stdin;
cmfba7p490000l804pcssef9c	+51949397406	\N	client	$2a$10$wljbHO6fRZ.LJyW1GBcgqelJh4.XkFTcV6fYVcFDKgfS2fCoJ6f8i	\N	\N	2025-09-08 15:33:48.394	2025-09-08 15:33:48.394	CAPALI	elviawg519	ELVIA
cmfba9awb0000k8043y6uhtd6	+51925927516	\N	client	$2a$10$dJgAb/kEhvKqkgOr0Cy/M.Is0JR0M7nWUDiJ.xZNd55CdNikjxXAu	\N	\N	2025-09-08 15:35:03.267	2025-09-08 15:35:03.267	CAPALI	evelynwg519	EVELYN
cmfbacshk0000ky04v36ch7f3	+51983091079	\N	client	$2a$10$8VRPAOP.SLthaBHIYeozEe8LrXIqRcC.F8NvvSdx1mWQMVGnmu8me	\N	\N	2025-09-08 15:37:46.041	2025-09-08 15:37:46.041	TORO ALVARADO	eneidawg519	ENEIDA
cmfbajbhk0000lg04c164dd1u	+51934999014	\N	client	$2a$10$.yUJb9aWZkAYqCmomF.Kjeg4IQgBikfVDrTCYZF0e94UkJNXJkCRm	\N	\N	2025-09-08 15:42:50.6	2025-09-08 15:42:50.6	ARNAO	gaelwg519	GAEL
cmfbb0bnb0000jr04fioiezjn	+51933039187	\N	client	$2a$10$m3Md.PcUWgW6ngjUb/vmYOt3aEp5a5BY/9QYyoiAMmHls5qM9PBEy	\N	\N	2025-09-08 15:56:03.96	2025-09-08 15:56:03.96	CORDERO	juliowg519	JULIO
cmfbd2c6y0000jo04ix3aaf6e	+51920124026	\N	client	$2a$10$tENCxHXmiTy4nZ9C2R9g7.gN2J8LTAKtlhEHoNpr14iDvFpHeUrlW	\N	\N	2025-09-08 16:53:37.21	2025-09-08 16:53:37.21	PILLACA BENDEZU	frankwg519	FRANK
cmfboep270000l4041phuts7m	+51918701454	\N	client	$2a$10$pkft8QTcQiXNNr0XxcA5QuPn5kaz8rLMsyoBYOyNvmLahwUF8QnPy	\N	\N	2025-09-08 22:11:09.536	2025-09-08 22:11:09.536	QUISPE SARMIENTO	jhaquelinwg519	JHAQUELIN
cmfbpnd2l0000js041pal79yh	+51970698400	\N	client	$2a$10$AQK.2PSVNeNPf7c3l/ChnekvPu9P63xpWthbOM4L6JNwkkD7tVyAi	\N	\N	2025-09-08 22:45:53.517	2025-09-08 22:45:53.517	CONDORI CISNEROS	ladywg519	LADY
cmfbrcjbo0000i8040eq4nin9	+51914430506	\N	client	$2a$10$/95m/DXRAUYvmHXNUp/HPeqMke7suyV1bra9jbrE/TdiE16Im/b26	\N	\N	2025-09-08 23:33:27.636	2025-09-08 23:33:27.636	NAVENTA TUEROS	deyviswg519	DEYVIS
cm9d6f9dn0000l1046fjqc0fq	971474484	\N	admin	$2b$10$F5GwELHkK9GWAa/MxKmatOqsj/0pJl4YUrS/QeNrgB2Qxjmj9Nay.	\N	\N	2025-04-11 14:25:01	2025-04-11 14:48:31	cuya conislla	edudk20@gmail.com	edudk20@gmail.com
cm9et2l970000ju04lh4wwkti	+51957107417	\N	client	$2a$10$9lkMaasiRTH7SJXVj0ePouWna2FEEyZ3veQFKPxJnVuR5TnkbLf8m	\N	\N	2025-04-12 22:46:47.323	2025-04-12 22:46:47.323	CALVERA HERRERA	fabriziowg519	FABRIZIO
cmfbtwpcb0000ky04412bgjra	+51935351000	\N	client	$2a$10$7qGuSASosPDn2klbT23q0.DtcpgR9YV7uYFJ5JKYNHF.0CsjvaMUK	\N	\N	2025-09-09 00:45:07.788	2025-09-09 00:45:07.788	NARAZA GUIDICHE	alejandrowg519	ALEJANDRO
cmevqj6dm0000um24ae4fxx35	948930779	\N	admin	$2b$10$AbvwwdkPwQiCm1jNBNy4q.SCsT8Nkej6qsA0xHQnjwdiVXT9lFJNG	\N	\N	2025-08-28 13:26:19	2025-08-28 13:26:19	Astonitas	Luis	Luis 
cmf22mbmd0000ju042uz9fcje	+51986363462	\N	admin	$2a$10$mXCGTMEjqilXnTKvi2I8Ge6AAwYuqYUBLTdYtHDp/yO3/qYfJc3jG	\N	\N	2025-09-01 23:51:18	2025-09-01 23:51:18	Ramirez Uscata	nicolewg519	Nicole
cm9d6ki6s0000l504trp6z0nw	+51971474484	\N	client	$2a$10$HnJpcrL8gSaVBP6wG2ZIdO2zuhs2q9hweh0GbdrC0PBwANx4X6Smu	\N	\N	2025-04-11 19:29:05.812	2025-09-09 00:50:37.616	SUAREZ GRANDEZ	edgar.suarez grandez	EDGAR
cmf5pguev0000l504ub28jfy2	+51921647254	\N	client	$2a$10$ebVsSKNVR54xRcsqoFVVK.Ql2Q6a.JPN2P6il3b0vJhdKpKlrEsF.	\N	\N	2025-09-04 17:54:12.343	2025-09-04 17:54:12.343	Gutierez	diegowg519	Diego
cmf5x93aq0000jp04aevovgqt	+51972809800	\N	client	$2a$10$Etje8gT2/wQoZiParCTDBOcflGr.E0XRHP4SgcSJMTLvzBZslnniq	\N	\N	2025-09-04 21:32:07.539	2025-09-04 21:32:07.539	Rios	edgarwg519	Edgar
cmf8rspbt0000jl04s96fvg5r	+51993288744	\N	client	$2a$10$waAN8I1o7zMGiqdR/Wd9a.jizLxn0GD1OXybTc/HA5BFS/OZenIZS	\N	\N	2025-09-06 21:22:43.385	2025-09-06 21:22:43.385	Cruz	bryanfernandowg519	Bryan Fernando
cmfbu50710000kz04o65818b3	+51934809122	\N	client	$2a$10$YtvsY2p0ETeh3qoDcEQmLOL6o28SEukvjGghcukhrXkg.OUBe6.zq	\N	\N	2025-09-09 00:51:35.102	2025-09-09 00:51:35.102	RUPIRE SARMIENTO	soledadwg519	SOLEDAD
cmf8tpuq90000l504rwbstrop	+51901748650	\N	client	$2a$10$ceRYfmgnzxp7v.nT954vKurFlLiSPul3AfwFK.7LAMlttEHb979jO	\N	\N	2025-09-06 22:16:29.65	2025-09-06 22:19:12.073	Perez Palomino	josemariawg519	Josemaria
cmf22rtu40000jv04968dy77m	986363462	\N	client	$2a$10$tVRCycygjV0I7eaeqJAI7eHjUaN8ubFGMGGCueYXggnYEB2KB26OS	\N	\N	2025-09-02 04:55:35.116	2025-09-07 20:26:45.037	Ramirez	naru	Nicole
cmfb9ky7p0000l804w07dvexa	+51961330570	\N	client	$2a$10$RpLeiUzXVbMgjuaZEGFwG.V7nfu8baiD9V2Jrm9HotA3Rh9mMPUzK	\N	\N	2025-09-08 15:16:07.093	2025-09-08 15:16:07.093	ALFARO LEON	lisbellwg519	LISBELL
cmfba5c520000lb045eqnlf8o	+51971904844	\N	client	$2a$10$Rj8dk.IBSDg7V0/GByeqje2TyyI9DfJQO3NG99mdXigQGcIgkDh3K	\N	\N	2025-09-08 15:31:58.263	2025-09-08 15:31:58.263	CAPALI	natalywg519	NATALY
cmfbu92m60000l704swhn1v5i	+51988064436	\N	client	$2a$10$JEHOZUSVZqx6QASI/h/9xuGH95hgmlF4rOxg5aX7H.7w98SsMIZ7i	\N	\N	2025-09-09 00:54:44.863	2025-09-09 00:54:44.863	QUISPE CARHUAS	marilinwg519	MARILIN
cmfbwhpuu0000if0474pu3jqt	955216619	\N	client	$2a$10$2x5IgfItFbGEHKrrpVpyp.VOI/b0ucIxHNy2tLOekKC8FjKKdDFSG	\N	\N	2025-09-09 01:57:27.463	2025-09-09 01:57:27.463	Calderon	Jefferson010101	Jefferson 
cmfd28n1w0000i904ljjykv4z	+51959398914	\N	client	$2a$10$kl4pJ2Uh2dRHXOuvkliQxeXlDs.9Zu83cOCgS5ROTL0JnvH1zDaGq	\N	\N	2025-09-09 21:26:07.796	2025-09-09 21:26:07.796	hualpa carbajal	jeanpierhualwg914	jeanpier
cmfh8jdgz0000l804k9d6xafv	+51926040833	\N	client	$2a$10$HKOzGi9ES9d8i0wKscXszeY7U5PYdnARXxEt0DmLMTq4tEL4PzWtW	\N	\N	2025-09-12 19:33:30.995	2025-09-12 19:33:30.995	CALLE	luiscallewg833	LUIS
cmfbd6y3z0000js048ujzb5t1	+51922099932	\N	client	$2a$10$ChNesQ96vMg/QvCxIMOUjetOAEkyXoFg6dTQKtu1aBel5GJMEoKPi	\N	\N	2025-09-08 16:57:12.24	2025-09-09 01:02:31.626	SAIRITUPAC VENTURA	antonywg519	ANTONY
cmfbuoky00000l804oa6dy9nx	+51971186650	\N	client	$2a$10$N73E03e8H4JIJDk4fM/pO.3/Cd4Isfr4bQPkdrbd.M3coE7tnQO2S	\N	\N	2025-09-09 01:06:48.457	2025-09-09 01:06:48.457	QUIROZ CAPALI	miawg519	MIA
cmfbuwj2n0002l804iz64u3u8	+51921954552	\N	client	$2a$10$pisSZ.wuAtMJc6BW8sJl5uaR32jGKNqOdfZzDR3BneIKHhCAWCLrO	\N	\N	2025-09-09 01:12:59.279	2025-09-09 01:12:59.279	TORREALVA DAVILA	giovannywg519	GIOVANNY
cmfbuxxzo0000lb04xlknfllh	+51923815599	\N	client	$2a$10$XFVWPItGVwsaHrZwOpB//un0c25Z16RLr5e52vqui/oYGCUtOFApS	\N	\N	2025-09-09 01:14:05.269	2025-09-09 01:14:05.269	CABRERA ROJAS	giovanniwg519	GIOVANNI
cmfbv3fz20000jx04rs5n7g86	+51976354459	\N	client	$2a$10$cdZmb.05dLYMGFARu0BsieDTfh7aOqWRXxXexhkPf/EXxlcS18ARS	\N	\N	2025-09-09 01:18:21.855	2025-09-09 01:18:21.855	IPARRAGUIRRE HUAMANI	claudiawg519	CLAUDIA
cmfbv9wax0000jx04sqxnlwff	+51966750309	\N	client	$2a$10$bo56CSmpdOcToY.0iTDqzurZ1DjqsjIkYqWd88pkd3UjYQU0AqfJi	\N	\N	2025-09-09 01:23:22.953	2025-09-09 01:25:54.869	PACHECO	jesuswg519	JESUS
cmfbvh1ee0000i204wkx75jyd	+51912754020	\N	client	$2a$10$05xG2JItA38X6Lh5SGshwuJJzGi9Mdaj/6cy0taSsBHz3QtzoZ996	\N	\N	2025-09-09 01:28:56.151	2025-09-09 01:28:56.151	PROVELEON CHAMPE	rosmelwg519	ROSMEL
cmfm2vonc0000umzkjlfqinji	51926040833	\N	client	$2a$10$u/J69jWpf4.//zl17qqgOeRiocqdcazsKfUWL4nWLCAC/ZPj23fFG	\N	\N	2025-09-16 04:53:58.512	2025-09-16 04:53:58.512	Calle	luiscallwg805369	Luis
cmfm31mkv0002umzkb7gyafya	51923040833	\N	client	$2a$10$A7LRjsx.8B4EzG7bedZ03eLHrkYkshZ1Aji8fFUX8T9jJR8jH36kq	\N	\N	2025-09-16 04:58:35.791	2025-09-16 04:58:35.791	Calle	luiscallwg522948	Luis
\.


--
-- Name: MembershipPlan_membership_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."MembershipPlan_membership_id_seq"', 1, false);


--
-- Name: PaymentRecord_payment_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."PaymentRecord_payment_id_seq"', 1, false);


--
-- Name: UserContact_contact_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public."UserContact_contact_id_seq"', 1, false);


--
-- Name: Account Account_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_pkey" PRIMARY KEY (id);


--
-- Name: Attendance Attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_pkey" PRIMARY KEY (id);


--
-- Name: ClientProfile ClientProfile_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ClientProfile"
    ADD CONSTRAINT "ClientProfile_pkey" PRIMARY KEY (profile_id);


--
-- Name: Gallery Gallery_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Gallery"
    ADD CONSTRAINT "Gallery_pkey" PRIMARY KEY (id);


--
-- Name: InventoryItem InventoryItem_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."InventoryItem"
    ADD CONSTRAINT "InventoryItem_pkey" PRIMARY KEY (item_id);


--
-- Name: MembershipPlan MembershipPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."MembershipPlan"
    ADD CONSTRAINT "MembershipPlan_pkey" PRIMARY KEY (membership_id);


--
-- Name: PaymentRecord PaymentRecord_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentRecord"
    ADD CONSTRAINT "PaymentRecord_pkey" PRIMARY KEY (payment_id);


--
-- Name: Plan Plan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Plan"
    ADD CONSTRAINT "Plan_pkey" PRIMARY KEY (id);


--
-- Name: Purchase Purchase_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Purchase"
    ADD CONSTRAINT "Purchase_pkey" PRIMARY KEY (id);


--
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- Name: Story Story_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Story"
    ADD CONSTRAINT "Story_pkey" PRIMARY KEY (id);


--
-- Name: UserContact UserContact_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserContact"
    ADD CONSTRAINT "UserContact_pkey" PRIMARY KEY (contact_id);


--
-- Name: UserMembershipPlan UserMembershipPlan_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserMembershipPlan"
    ADD CONSTRAINT "UserMembershipPlan_pkey" PRIMARY KEY ("userId", "membershipId");


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: fingerprints fingerprints_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fingerprints
    ADD CONSTRAINT fingerprints_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: Account_provider_providerAccountId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON public."Account" USING btree (provider, "providerAccountId");


--
-- Name: Attendance_userId_checkInTime_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Attendance_userId_checkInTime_idx" ON public."Attendance" USING btree ("userId", "checkInTime");


--
-- Name: ClientProfile_user_id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "ClientProfile_user_id_key" ON public."ClientProfile" USING btree (user_id);


--
-- Name: Plan_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Plan_slug_key" ON public."Plan" USING btree (slug);


--
-- Name: Session_sessionToken_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Session_sessionToken_key" ON public."Session" USING btree ("sessionToken");


--
-- Name: fingerprints_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "fingerprints_userId_key" ON public.fingerprints USING btree ("userId");


--
-- Name: users_phoneNumber_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "users_phoneNumber_key" ON public.users USING btree ("phoneNumber");


--
-- Name: users_username_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX users_username_key ON public.users USING btree (username);


--
-- Name: Account Account_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Account"
    ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Attendance Attendance_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Attendance"
    ADD CONSTRAINT "Attendance_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: ClientProfile ClientProfile_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."ClientProfile"
    ADD CONSTRAINT "ClientProfile_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PaymentRecord PaymentRecord_payer_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PaymentRecord"
    ADD CONSTRAINT "PaymentRecord_payer_user_id_fkey" FOREIGN KEY (payer_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Purchase Purchase_customerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Purchase"
    ADD CONSTRAINT "Purchase_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Purchase Purchase_productId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Purchase"
    ADD CONSTRAINT "Purchase_productId_fkey" FOREIGN KEY ("productId") REFERENCES public."InventoryItem"(item_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: Session Session_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: UserContact UserContact_contact_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserContact"
    ADD CONSTRAINT "UserContact_contact_user_id_fkey" FOREIGN KEY (contact_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserMembershipPlan UserMembershipPlan_membershipId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserMembershipPlan"
    ADD CONSTRAINT "UserMembershipPlan_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES public."MembershipPlan"(membership_id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: UserMembershipPlan UserMembershipPlan_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."UserMembershipPlan"
    ADD CONSTRAINT "UserMembershipPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: fingerprints fingerprints_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.fingerprints
    ADD CONSTRAINT "fingerprints_userId_fkey" FOREIGN KEY ("userId") REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

