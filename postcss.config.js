// 构建时自动把 px 转成 rem（源码统一用 px 书写，rootValue 与 index.html 根字号基准一致）
export default {
  plugins: {
    'postcss-pxtorem': {
      rootValue: 16,
      unitPrecision: 5,
      propList: ['*'],
      minPixelValue: 0,
      mediaQuery: false, // @media 断点保留 px
    },
  },
}
