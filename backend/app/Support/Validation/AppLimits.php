<?php

namespace App\Support\Validation;

class AppLimits
{
    /**
     * Two-layer limits:
     * - APP_* are user-facing/business constraints.
     * - DB_* document schema/storage limits.
     */
    public const CHECKLIST_TASK_APP_MIN = 2;
    public const CHECKLIST_TASK_APP_MAX = 500;
    public const CHECKLIST_TASK_DB_MAX = 65535; // TEXT

    public const CHECKLIST_TASK_ROWS_APP_MAX = 200;
    public const CHECKLIST_TASK_ROWS_DB_MAX = 4294967295; // unsigned int practical upper bound

    public const CHECKLIST_SORT_ORDER_APP_MIN = 1;
    public const CHECKLIST_SORT_ORDER_APP_MAX = 10000;
    public const CHECKLIST_SORT_ORDER_DB_MIN = 0; // unsigned int
    public const CHECKLIST_SORT_ORDER_DB_MAX = 4294967295; // unsigned int

    public const DIRECTORY_AGENCY_NAME_APP_MIN = 2;
    public const DIRECTORY_AGENCY_NAME_APP_MAX = 255;
    public const DIRECTORY_AGENCY_NAME_DB_MAX = 255; // VARCHAR(255)

    public const DIRECTORY_FULL_NAME_APP_MAX = 255;
    public const DIRECTORY_FULL_NAME_DB_MAX = 255; // VARCHAR(255)

    public const DIRECTORY_SUMMARY_APP_MAX = 2000;
    public const DIRECTORY_SUMMARY_DB_MAX = 65535; // TEXT

    public const DIRECTORY_CONTACT_TYPE_APP_MAX = 100;
    public const DIRECTORY_CONTACT_TYPE_DB_MAX = 255; // VARCHAR(255)

    public const DIRECTORY_CONTACT_LABEL_APP_MAX = 255;
    public const DIRECTORY_CONTACT_LABEL_DB_MAX = 255; // VARCHAR(255)

    public const DIRECTORY_CONTACT_VALUE_APP_MIN = 2;
    public const DIRECTORY_CONTACT_VALUE_APP_MAX = 1000;
    public const DIRECTORY_CONTACT_VALUE_DB_MAX = 65535; // TEXT

    public const DIRECTORY_PROCESS_TEXT_APP_MIN = 2;
    public const DIRECTORY_PROCESS_TEXT_APP_MAX = 1000;
    public const DIRECTORY_PROCESS_TEXT_DB_MAX = 65535; // TEXT

    public const DIRECTORY_GENERAL_ESTABLISHMENT_APP_MIN = 2;
    public const DIRECTORY_GENERAL_ESTABLISHMENT_APP_MAX = 255;
    public const DIRECTORY_GENERAL_ESTABLISHMENT_DB_MAX = 255; // VARCHAR(255)

    public const DIRECTORY_GENERAL_SERVICES_APP_MAX = 255;
    public const DIRECTORY_GENERAL_SERVICES_DB_MAX = 255; // VARCHAR(255)

    public const DIRECTORY_GENERAL_CONTACT_PERSON_APP_MAX = 255;
    public const DIRECTORY_GENERAL_CONTACT_PERSON_DB_MAX = 255; // VARCHAR(255)

    public const DIRECTORY_GENERAL_VALUE_APP_MIN = 2;
    public const DIRECTORY_GENERAL_VALUE_APP_MAX = 1000;
    public const DIRECTORY_GENERAL_VALUE_DB_MAX = 65535; // TEXT

    public const FORBIDDEN_TEXT_REGEX = '/[<>`{}\[\]\\\\|^~]/';
    public const FORBIDDEN_TEXT_LABEL = '< > ` { } [ ] \\ | ^ ~';
}
