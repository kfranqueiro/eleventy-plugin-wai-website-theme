var translationStrings = {
{%- for t in site.data.translations -%}
{%- if t.javascript == true -%}
  "{{t.en}}": "{{t[language]}}",
{%- endif -%}
{%- endfor -%}
};