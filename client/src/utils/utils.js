// export const calcMethods = [
//   {
//     key: 'Average',
//     value: 0,
//     sub: [
//       {
//         key: 'Arithmetic Mean',
//         value: 0
//       },
//       {
//         key: 'Truncated Mean',
//         value: 1
//       }
//     ]
//   },
//   {
//     key: 'Median',
//     value: 1
//   },
//   {
//     key: 'Customized',
//     value: 2
//   }
// ];

export const calcMethods = [
  {
    lang: 'arithmetic_mean',
    value: 0
  },
  {
    lang: 'truncated_mean',
    value: 1
  },
  {
    lang: 'median',
    value: 2
  },
  {
    lang: 'customized',
    value: 3
  }
];

export const cards = [
  {
    key: '0',
    value: 0,
    icon: '../images/cards/0.png',
    corner: '../images/cards/_0.png'
  },
  {
    key: '1/2',
    value: 0.5,
    icon: '../images/cards/0.5.png',
    corner: '../images/cards/_0.5.png'
  },
  {
    key: '1',
    value: 1,
    icon: '../images/cards/1.png',
    corner: '../images/cards/_1.png'
  },
  {
    key: '2',
    value: 2,
    icon: '../images/cards/2.png',
    corner: '../images/cards/_2.png'
  },
  {
    key: '3',
    value: 3,
    icon: '../images/cards/3.png',
    corner: '../images/cards/_3.png'
  },
  {
    key: '5',
    value: 5,
    icon: '../images/cards/5.png',
    corner: '../images/cards/_5.png'
  },
  {
    key: '8',
    value: 8,
    icon: '../images/cards/8.png',
    corner: '../images/cards/_8.png'
  },
  {
    key: '13',
    value: 13,
    icon: '../images/cards/13.png',
    corner: '../images/cards/_13.png'
  },
  {
    key: '20',
    value: 20,
    icon: '../images/cards/20.png',
    corner: '../images/cards/_20.png'
  },
  {
    key: '40',
    value: 40,
    icon: '../images/cards/40.png',
    corner: '../images/cards/_40.png'
  },
  {
    key: '100',
    value: 100,
    icon: '../images/cards/100.png',
    corner: '../images/cards/_100.png'
  },
  {
    key: '?',
    value: -1,
    icon: '../images/cards/Q.png',
    corner: '../images/cards/_Q.png'
  }
  // {
  //   key: 'C',
  //   corner: 'coffee',
  //   value: -2,
  //   icon: '../images/cards/C.png',
  //   corner: '../images/cards/_C.png',
  // }
];

export const initResults = new Array(31).fill(null).map((v, i) => i).concat([0.5, 40, 55, 89, 100]).sort((i, j) => i - j);

export const formatTime = date => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();

  return [year, month, day].map(formatNumber).join('-') + ',' + ' ' + [hour, minute, second].map(formatNumber).join(':');
};

export const formatTimer = timer => {
  const hour = Math.floor(timer / 3600);
  const minute = Math.floor((timer % 3600) / 60);
  const second = timer % 60;
  return `${formatNumber(hour)}:${formatNumber(minute)}:${formatNumber(second)}`;
};

export const formatDate = date => {
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return [year, month, day].map(formatNumber).join('-');
};

export const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : '0' + n;
};

export const defaultLang = 'zh_CN';

export const LANG_KEY = 'lang';

export const TOKEN_KEY = 'token';

export const INSTRUCTION_KEY = 'Instruction';
