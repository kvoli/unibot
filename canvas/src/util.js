"use strict";

import dayjs from "dayjs";

export const shouldPublish = (published, delayed_date) =>
  published == undefined
    ? true
    : published && (delayed_date ? dayjs().isAfter(dayjs(delayed_date)) : true);
