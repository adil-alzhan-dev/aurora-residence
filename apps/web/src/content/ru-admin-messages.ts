import type { AdminDictionary } from "./en-admin";

/** Русские подписи для текстов, которые API и демо-данные хранят по-английски. */
export const messagesRu: AdminDictionary["messages"] = {
  system: "Система",
  sources: {
    "Contacts form": "Форма контактов",
    "Residence page": "Страница квартиры",
    "Residence page, Send request": "Страница квартиры, «Отправить заявку»",
    "Floor plan, Enquire": "План этажа, «Оставить заявку»",
  },
  api: {
    enquiryNoResidence: "У заявки нет квартиры: сначала привяжите к ней {number}.",
    enquiryOtherResidence: "Заявка о квартире {other}, а не о {number}.",
    enquiryClosed: "Заявка закрыта: сначала верните её в статус «В работе».",
    enquiryNotFound: "Этой заявки больше нет.",
    residenceNotFound: "Квартиры {number} нет.",
    noActiveReservation: "У квартиры {number} нет активной брони.",
    notAvailable: "Квартира {number} уже не свободна.",
    changedMeanwhile: "Квартиру {number} только что изменили.",
    reserveFromEnquiry: "Квартиру {number} можно забронировать только из заявки.",
  },
  notes: {
    received: "Заявка с сайта, квартира {number} остаётся свободной",
    receivedWithStatus: "Заявка с сайта, квартира {number}: {status}, статус не менялся",
    receivedGeneral: "Заявка с сайта, квартира не выбрана",
    reserved: "Бронь на 7 дней",
    reservedFor: "Бронь на 7 дней по заявке {name}",
    expired: "Бронь истекла через 7 дней без сделки",
    released: "Бронь снята менеджером",
    backOnSale: "Снова в продаже",
    sold: "Договор подписан",
    reservedForEnquiry: "Квартира забронирована по этой заявке",
    linked: "К заявке привязана квартира {number}",
    salesStart: "Старт продаж, цена {price}",
    known: {
      "Summer price list": "Летний прайс",
      "Autumn price list": "Осенний прайс",
      "Not buying: chose another project": "Не покупает: выбрал другой проект",
      "Not buying this year": "В этом году не покупает",
      "Price list sent, no further interest": "Прайс отправлен, интереса больше нет",
      "Reservation ended without a deal": "Бронь закончилась без сделки",
    },
  },
};
