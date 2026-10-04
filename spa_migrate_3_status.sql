USE SpaBookingDB;
GO

IF OBJECT_ID(N'dbo.LICH_HEN', N'U') IS NULL
    THROW 50001, 'Table dbo.LICH_HEN does not exist.', 1;
GO

IF EXISTS (
    SELECT 1
    FROM dbo.LICH_HEN
    WHERE status NOT IN ('pending', 'confirmed', 'completed')
)
    THROW 50002, 'LICH_HEN contains cancelled/no_show statuses. Resolve those rows before applying the three-status constraint.', 1;
GO

IF OBJECT_ID(N'dbo.CK_LICH_HEN_status', N'C') IS NOT NULL
    ALTER TABLE dbo.LICH_HEN DROP CONSTRAINT CK_LICH_HEN_status;
GO

ALTER TABLE dbo.LICH_HEN
ADD CONSTRAINT CK_LICH_HEN_status
CHECK (status IN ('pending', 'confirmed', 'completed'));
GO