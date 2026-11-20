USE [ANRPC_HRSelections]
GO
/****** Object:  Table [dbo].[ContestSettings]    Script Date: 11/20/2026 2:39:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[ContestSettings](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[ContestName] [nvarchar](200) NOT NULL,
	[OpenDate] [datetime2](7) NOT NULL,
	[DeadlineDate] [datetime2](7) NOT NULL,
	[IsActive] [bit] NOT NULL,
	[UpdatedBy] [int] NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Criteria]    Script Date: 11/20/2026 2:39:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Criteria](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[NameAr] [nvarchar](200) NOT NULL,
	[SortOrder] [int] NOT NULL,
	[IsActive] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[DeadlineChangeLog]    Script Date: 11/20/2026 2:39:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[DeadlineChangeLog](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[SettingsId] [int] NOT NULL,
	[OldDeadline] [datetime2](7) NOT NULL,
	[NewDeadline] [datetime2](7) NOT NULL,
	[ChangedBy] [int] NULL,
	[ChangedAt] [datetime2](7) NOT NULL,
	[Reason] [nvarchar](500) NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FileStorageSettings]    Script Date: 11/20/2026 2:39:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FileStorageSettings](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[Name] [nvarchar](50) NOT NULL,
	[BasePath] [nvarchar](500) NOT NULL,
	[IsActive] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[FileTypes]    Script Date: 11/20/2026 2:39:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[FileTypes](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[NameAr] [nvarchar](100) NOT NULL,
	[SortOrder] [int] NOT NULL,
	[IsActive] [bit] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Reviews]    Script Date: 11/20/2026 2:39:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Reviews](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[SubmissionId] [int] NOT NULL,
	[ReviewerId] [int] NOT NULL,
	[Stars] [tinyint] NOT NULL,
	[Notes] [nvarchar](max) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SubmissionCriteria]    Script Date: 11/20/2026 2:39:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SubmissionCriteria](
	[SubmissionId] [int] NOT NULL,
	[CriterionId] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[SubmissionId] ASC,
	[CriterionId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[SubmissionFiles]    Script Date: 11/20/2026 2:39:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[SubmissionFiles](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[SubmissionId] [int] NOT NULL,
	[FileTypeId] [int] NOT NULL,
	[StorageId] [int] NOT NULL,
	[OriginalFileName] [nvarchar](260) NOT NULL,
	[StoredFileName] [nvarchar](100) NOT NULL,
	[RelativePath] [nvarchar](300) NOT NULL,
	[FileSizeBytes] [bigint] NULL,
	[UploadedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Submissions]    Script Date: 11/20/2026 2:39:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Submissions](
	[Id] [int] IDENTITY(1,1) NOT NULL,
	[empn] [int] NOT NULL,
	[code_edara] [int] NULL,
	[Title] [nvarchar](300) NOT NULL,
	[SubmissionType] [tinyint] NOT NULL,
	[Location] [nvarchar](200) NULL,
	[TeamMembers] [nvarchar](max) NULL,
	[Challenge] [nvarchar](max) NULL,
	[Efforts] [nvarchar](max) NULL,
	[Results] [nvarchar](max) NULL,
	[Impact] [nvarchar](max) NULL,
	[Inspiration] [nvarchar](max) NULL,
	[CreatedAt] [datetime2](7) NOT NULL,
	[UpdatedAt] [datetime2](7) NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[Id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[T_Edarat]    Script Date: 11/20/2026 2:39:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[T_Edarat](
	[edara_code] [int] NOT NULL,
	[edara_text] [nvarchar](max) NULL,
 CONSTRAINT [PK_T_Edarat] PRIMARY KEY CLUSTERED 
(
	[edara_code] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[T_HRUsers]    Script Date: 11/20/2026 2:39:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[T_HRUsers](
	[id_user] [int] IDENTITY(1,1) NOT NULL,
	[empn] [int] NULL,
	[Username] [nvarchar](50) NULL,
	[PasswordHash] [nvarchar](255) NULL,
	[FullName] [nvarchar](200) NULL,
 CONSTRAINT [PK_HRUsers] PRIMARY KEY CLUSTERED 
(
	[id_user] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[T_MAST]    Script Date: 11/20/2026 2:39:51 PM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[T_MAST](
	[empn] [int] NOT NULL,
	[ename] [nvarchar](max) NULL,
	[code_edara] [int] NULL,
	[code_wazifa] [int] NULL,
	[COD_TS] [int] NULL,
	[ID_NO] [nvarchar](max) NULL,
	[e_mail] [nvarchar](max) NULL,
	[internal_phone] [nvarchar](max) NULL,
	[mobile_no] [nvarchar](max) NULL,
	[nwazifa] [nvarchar](max) NULL,
 CONSTRAINT [PK_T_MAST] PRIMARY KEY CLUSTERED 
(
	[empn] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
SET IDENTITY_INSERT [dbo].[ContestSettings] ON 

INSERT [dbo].[ContestSettings] ([Id], [ContestName], [OpenDate], [DeadlineDate], [IsActive], [UpdatedBy], [UpdatedAt]) VALUES (1, N'مسابقة قصص النجاح والتميز', CAST(N'2026-11-19T19:05:39.2169268' AS DateTime2), CAST(N'2026-12-31T23:59:00.0000000' AS DateTime2), 1, NULL, CAST(N'2026-11-19T19:05:39.2169268' AS DateTime2))
SET IDENTITY_INSERT [dbo].[ContestSettings] OFF
GO
SET IDENTITY_INSERT [dbo].[Criteria] ON 

INSERT [dbo].[Criteria] ([Id], [NameAr], [SortOrder], [IsActive]) VALUES (1, N'زيادة الإنتاج', 1, 1)
INSERT [dbo].[Criteria] ([Id], [NameAr], [SortOrder], [IsActive]) VALUES (2, N'خفض التكاليف', 2, 1)
INSERT [dbo].[Criteria] ([Id], [NameAr], [SortOrder], [IsActive]) VALUES (3, N'الابتكار والتطوير', 3, 1)
INSERT [dbo].[Criteria] ([Id], [NameAr], [SortOrder], [IsActive]) VALUES (4, N'السلامة والصحة المهنية', 4, 1)
INSERT [dbo].[Criteria] ([Id], [NameAr], [SortOrder], [IsActive]) VALUES (5, N'التغلب على التحديات', 5, 1)
INSERT [dbo].[Criteria] ([Id], [NameAr], [SortOrder], [IsActive]) VALUES (6, N'التحول الرقمي', 6, 1)
INSERT [dbo].[Criteria] ([Id], [NameAr], [SortOrder], [IsActive]) VALUES (7, N'العمل الجماعي', 7, 1)
INSERT [dbo].[Criteria] ([Id], [NameAr], [SortOrder], [IsActive]) VALUES (8, N'التميز المهني', 8, 1)
INSERT [dbo].[Criteria] ([Id], [NameAr], [SortOrder], [IsActive]) VALUES (9, N'ترشيد الطاقة وحماية البيئة', 9, 1)
SET IDENTITY_INSERT [dbo].[Criteria] OFF
GO
SET IDENTITY_INSERT [dbo].[FileStorageSettings] ON 

INSERT [dbo].[FileStorageSettings] ([Id], [Name], [BasePath], [IsActive]) VALUES (1, N'ContestFiles', N'E:\HR-Selections\Documents', 1)
SET IDENTITY_INSERT [dbo].[FileStorageSettings] OFF
GO
SET IDENTITY_INSERT [dbo].[FileTypes] ON 

INSERT [dbo].[FileTypes] ([Id], [NameAr], [SortOrder], [IsActive]) VALUES (1, N'تقرير', 1, 1)
INSERT [dbo].[FileTypes] ([Id], [NameAr], [SortOrder], [IsActive]) VALUES (2, N'صور', 2, 1)
INSERT [dbo].[FileTypes] ([Id], [NameAr], [SortOrder], [IsActive]) VALUES (3, N'شهادة تقدير', 3, 1)
INSERT [dbo].[FileTypes] ([Id], [NameAr], [SortOrder], [IsActive]) VALUES (4, N'أخرى', 4, 1)
SET IDENTITY_INSERT [dbo].[FileTypes] OFF
GO
SET IDENTITY_INSERT [dbo].[Reviews] ON 

INSERT [dbo].[Reviews] ([Id], [SubmissionId], [ReviewerId], [Stars], [Notes], [CreatedAt], [UpdatedAt]) VALUES (1, 1, 1, 5, N'.sf.dnv.,dv.c,.vmc,.xmv.,cmx.v,mcx.,vmcxv.cxmv', CAST(N'2026-11-20T10:34:02.9070000' AS DateTime2), CAST(N'2026-11-20T10:34:02.9070000' AS DateTime2))
SET IDENTITY_INSERT [dbo].[Reviews] OFF
GO
INSERT [dbo].[SubmissionCriteria] ([SubmissionId], [CriterionId]) VALUES (1, 1)
INSERT [dbo].[SubmissionCriteria] ([SubmissionId], [CriterionId]) VALUES (1, 4)
INSERT [dbo].[SubmissionCriteria] ([SubmissionId], [CriterionId]) VALUES (1, 5)
GO
SET IDENTITY_INSERT [dbo].[SubmissionFiles] ON 

INSERT [dbo].[SubmissionFiles] ([Id], [SubmissionId], [FileTypeId], [StorageId], [OriginalFileName], [StoredFileName], [RelativePath], [FileSizeBytes], [UploadedAt]) VALUES (1, 1, 1, 1, N'7 الترتيب.png', N'473bb712-7791-4dee-be3e-069997b81804.png', N'900001/473bb712-7791-4dee-be3e-069997b81804.png', 146970, CAST(N'2026-11-19T21:08:16.2470000' AS DateTime2))
INSERT [dbo].[SubmissionFiles] ([Id], [SubmissionId], [FileTypeId], [StorageId], [OriginalFileName], [StoredFileName], [RelativePath], [FileSizeBytes], [UploadedAt]) VALUES (2, 1, 1, 1, N'bos ba2a bel nesba l makan el files elli hayt3mlha upload - Copy.docx', N'd5be9076-85fa-4e22-b987-68b31adcd7f3.docx', N'900001/d5be9076-85fa-4e22-b987-68b31adcd7f3.docx', 16883, CAST(N'2026-11-19T21:08:16.2470000' AS DateTime2))
SET IDENTITY_INSERT [dbo].[SubmissionFiles] OFF
GO
SET IDENTITY_INSERT [dbo].[Submissions] ON 

INSERT [dbo].[Submissions] ([Id], [empn], [code_edara], [Title], [SubmissionType], [Location], [TeamMembers], [Challenge], [Efforts], [Results], [Impact], [Inspiration], [CreatedAt], [UpdatedAt]) VALUES (1, 900001, 990, N'ششششششششششششش', 2, N'dfgfdhdfhdfh', N'سماح', N'بيايبلا', N'يبايبايباKjhkhdf
يليسليس', N'ايبايب', N'سيليسلس', N'سابساا', CAST(N'2026-11-19T21:08:16.2470000' AS DateTime2), CAST(N'2026-11-19T21:08:16.2470000' AS DateTime2))
SET IDENTITY_INSERT [dbo].[Submissions] OFF
GO
INSERT [dbo].[T_Edarat] ([edara_code], [edara_text]) VALUES (990, N'إدارة تجريبية - HR Selections')
INSERT [dbo].[T_Edarat] ([edara_code], [edara_text]) VALUES (991, N'إدارة نظم المعلومات')
INSERT [dbo].[T_Edarat] ([edara_code], [edara_text]) VALUES (992, N'إدارة الموارد البشرية')
INSERT [dbo].[T_Edarat] ([edara_code], [edara_text]) VALUES (993, N'الإدارة المالية')
INSERT [dbo].[T_Edarat] ([edara_code], [edara_text]) VALUES (994, N'إدارة المشروعات')
INSERT [dbo].[T_Edarat] ([edara_code], [edara_text]) VALUES (995, N'إدارة الشئون الفنية')
GO
SET IDENTITY_INSERT [dbo].[T_HRUsers] ON 

INSERT [dbo].[T_HRUsers] ([id_user], [empn], [Username], [PasswordHash], [FullName]) VALUES (1, 999999, N'hr.admin', N'$2y$12$HxnLKFl/BcZp5j4tr4Mjrulru.scbcG.JiqH5kFLppWtfleLhxlRW', N'مسؤول الموارد البشرية')
SET IDENTITY_INSERT [dbo].[T_HRUsers] OFF
GO
INSERT [dbo].[T_MAST] ([empn], [ename], [code_edara], [code_wazifa], [COD_TS], [ID_NO], [e_mail], [internal_phone], [mobile_no], [nwazifa]) VALUES (900001, N'موظف تجريبي', 990, 999, 999, N'00000000000000', N'test.employee@anrpc.local', N'1000', N'01000000000', N'مهندس تجريبي')
INSERT [dbo].[T_MAST] ([empn], [ename], [code_edara], [code_wazifa], [COD_TS], [ID_NO], [e_mail], [internal_phone], [mobile_no], [nwazifa]) VALUES (900002, N'أحمد محمد علي', 991, 101, 1, N'10000000000002', N'ahmed.mohamed@anrpc.local', N'1102', N'01000000002', N'مهندس نظم')
INSERT [dbo].[T_MAST] ([empn], [ename], [code_edara], [code_wazifa], [COD_TS], [ID_NO], [e_mail], [internal_phone], [mobile_no], [nwazifa]) VALUES (900003, N'محمد أحمد حسن', 991, 102, 1, N'10000000000003', N'mohamed.ahmed@anrpc.local', N'1103', N'01000000003', N'مبرمج')
INSERT [dbo].[T_MAST] ([empn], [ename], [code_edara], [code_wazifa], [COD_TS], [ID_NO], [e_mail], [internal_phone], [mobile_no], [nwazifa]) VALUES (900004, N'سارة محمود إبراهيم', 992, 201, 2, N'10000000000004', N'sara.mahmoud@anrpc.local', N'1204', N'01000000004', N'أخصائي موارد بشرية')
INSERT [dbo].[T_MAST] ([empn], [ename], [code_edara], [code_wazifa], [COD_TS], [ID_NO], [e_mail], [internal_phone], [mobile_no], [nwazifa]) VALUES (900005, N'منى أحمد عبد الله', 992, 202, 2, N'10000000000005', N'mona.ahmed@anrpc.local', N'1205', N'01000000005', N'رئيس قسم')
INSERT [dbo].[T_MAST] ([empn], [ename], [code_edara], [code_wazifa], [COD_TS], [ID_NO], [e_mail], [internal_phone], [mobile_no], [nwazifa]) VALUES (900006, N'خالد سمير حسن', 993, 301, 3, N'10000000000006', N'khaled.samir@anrpc.local', N'1306', N'01000000006', N'محاسب')
INSERT [dbo].[T_MAST] ([empn], [ename], [code_edara], [code_wazifa], [COD_TS], [ID_NO], [e_mail], [internal_phone], [mobile_no], [nwazifa]) VALUES (900007, N'نهى مصطفى علي', 993, 302, 3, N'10000000000007', N'noha.mostafa@anrpc.local', N'1307', N'01000000007', N'أخصائي مالي')
INSERT [dbo].[T_MAST] ([empn], [ename], [code_edara], [code_wazifa], [COD_TS], [ID_NO], [e_mail], [internal_phone], [mobile_no], [nwazifa]) VALUES (900008, N'محمود إبراهيم السيد', 994, 401, 4, N'10000000000008', N'mahmoud.ibrahim@anrpc.local', N'1408', N'01000000008', N'مهندس مشروعات')
INSERT [dbo].[T_MAST] ([empn], [ename], [code_edara], [code_wazifa], [COD_TS], [ID_NO], [e_mail], [internal_phone], [mobile_no], [nwazifa]) VALUES (900009, N'أحمد سامي يوسف', 994, 402, 4, N'10000000000009', N'ahmed.samy@anrpc.local', N'1409', N'01000000009', N'مهندس تخطيط')
INSERT [dbo].[T_MAST] ([empn], [ename], [code_edara], [code_wazifa], [COD_TS], [ID_NO], [e_mail], [internal_phone], [mobile_no], [nwazifa]) VALUES (900010, N'شريف عادل محمود', 995, 501, 5, N'10000000000010', N'sherif.adel@anrpc.local', N'1510', N'01000000010', N'مهندس فني')
INSERT [dbo].[T_MAST] ([empn], [ename], [code_edara], [code_wazifa], [COD_TS], [ID_NO], [e_mail], [internal_phone], [mobile_no], [nwazifa]) VALUES (900011, N'مريم طارق حسن', 995, 502, 5, N'10000000000011', N'mariam.tarek@anrpc.local', N'1511', N'01000000011', N'أخصائي فني')
GO
/****** Object:  Index [UQ_Reviews_OnePerReviewer]    Script Date: 11/20/2026 2:39:52 PM ******/
ALTER TABLE [dbo].[Reviews] ADD  CONSTRAINT [UQ_Reviews_OnePerReviewer] UNIQUE NONCLUSTERED 
(
	[SubmissionId] ASC,
	[ReviewerId] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
SET ANSI_PADDING ON
GO
/****** Object:  Index [UQ__HRUsers__536C85E422657116]    Script Date: 11/20/2026 2:39:52 PM ******/
ALTER TABLE [dbo].[T_HRUsers] ADD  CONSTRAINT [UQ__HRUsers__536C85E422657116] UNIQUE NONCLUSTERED 
(
	[Username] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, SORT_IN_TEMPDB = OFF, IGNORE_DUP_KEY = OFF, ONLINE = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
GO
ALTER TABLE [dbo].[ContestSettings] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[ContestSettings] ADD  DEFAULT (sysdatetime()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[Criteria] ADD  DEFAULT ((0)) FOR [SortOrder]
GO
ALTER TABLE [dbo].[Criteria] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[DeadlineChangeLog] ADD  DEFAULT (sysdatetime()) FOR [ChangedAt]
GO
ALTER TABLE [dbo].[FileStorageSettings] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[FileTypes] ADD  DEFAULT ((0)) FOR [SortOrder]
GO
ALTER TABLE [dbo].[FileTypes] ADD  DEFAULT ((1)) FOR [IsActive]
GO
ALTER TABLE [dbo].[Reviews] ADD  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Reviews] ADD  DEFAULT (sysdatetime()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[SubmissionFiles] ADD  DEFAULT (sysdatetime()) FOR [UploadedAt]
GO
ALTER TABLE [dbo].[Submissions] ADD  DEFAULT (sysdatetime()) FOR [CreatedAt]
GO
ALTER TABLE [dbo].[Submissions] ADD  DEFAULT (sysdatetime()) FOR [UpdatedAt]
GO
ALTER TABLE [dbo].[DeadlineChangeLog]  WITH CHECK ADD FOREIGN KEY([SettingsId])
REFERENCES [dbo].[ContestSettings] ([Id])
GO
ALTER TABLE [dbo].[Reviews]  WITH CHECK ADD FOREIGN KEY([SubmissionId])
REFERENCES [dbo].[Submissions] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[SubmissionCriteria]  WITH CHECK ADD FOREIGN KEY([CriterionId])
REFERENCES [dbo].[Criteria] ([Id])
GO
ALTER TABLE [dbo].[SubmissionCriteria]  WITH CHECK ADD FOREIGN KEY([SubmissionId])
REFERENCES [dbo].[Submissions] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[SubmissionFiles]  WITH CHECK ADD FOREIGN KEY([FileTypeId])
REFERENCES [dbo].[FileTypes] ([Id])
GO
ALTER TABLE [dbo].[SubmissionFiles]  WITH CHECK ADD FOREIGN KEY([StorageId])
REFERENCES [dbo].[FileStorageSettings] ([Id])
GO
ALTER TABLE [dbo].[SubmissionFiles]  WITH CHECK ADD FOREIGN KEY([SubmissionId])
REFERENCES [dbo].[Submissions] ([Id])
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[Reviews]  WITH CHECK ADD CHECK  (([Stars]>=(1) AND [Stars]<=(5)))
GO
ALTER TABLE [dbo].[Submissions]  WITH CHECK ADD  CONSTRAINT [CK_Submissions_Type] CHECK  (([SubmissionType]=(2) OR [SubmissionType]=(1)))
GO
ALTER TABLE [dbo].[Submissions] CHECK CONSTRAINT [CK_Submissions_Type]
GO
