import * as moment from 'moment-holiday';

const holidays = {
    "Nytårsdag": {
        date: '1/1',
        keywords: ['nytarsdag', 'new', 'years']
    },
    "Skærtorsdag": {
        date: 'easter-3',
        keywords: ['skærtordag', 'skær', 'thursday']
    },
    "Langfredag": {
        date: 'easter-2',
        keywords: ['langfredag', 'good', 'friday']
    },
    "Påske": {
        date: 'easter',
        keywords: ['paske', 'easter', 'sunday'],
    },
    "Anden påskedag": {
        date: 'easter+1',
        keywords: ['andenpåskedag', 'andenpaskedag', 'paskedag', 'easter', 'monday']
    },
    "Store bededag": {
        date: 'easter+26',
        keywords: ['storebededag', 'store']
    },
    "Kristi himmelfart": {
        date: 'easter+39',
        kaywords: ['ascension']
    },
    "Pinse": {
        date: 'easter+49',
        keywords: ['pentecost']
    },
    "Anden pinse": {
        date: 'easter+50',
        keywords: ['andenpinsedag', 'pinsedag', 'whit', 'monday']
    },
    "Første juledag": {
        date: '12/25',
        keywords: ['førstejuledag', 'foerstejuledag'],
        keywords_y: ['første', 'foerste']
    },
    "Anden juledag": {
        date: '12/26',
        keywords: ['andenjuledag'],
        keywords_y: ['anden']
    }
};

moment.modifyHolidays.set(holidays);

