module Jekyll
    class DefinitionBlock < Liquid::Block
      def initialize(tag_name, text, tokens)
        super
      end
      require "kramdown"
      def render(context)
        content = super
        "<div class='block definition' markdown='1'>#{content}</div>"
      end
    end
  class ExampleBlock < Liquid::Block
      def initialize(tag_name, text, tokens)
        super
      end
      require "kramdown"
      def render(context)
        content = super
        "<div class='block example' markdown='1'>#{content}</div>"
      end
    end
  class EquationBlock < Liquid::Block
      def initialize(tag_name, text, tokens)
        super
      end
      require "kramdown"
      def render(context)
        content = super
        "<div class='block equation' markdown='1'>#{content}</div>"
      end
    end
  end
  Liquid::Template.register_tag('definition', Jekyll::DefinitionBlock)
  Liquid::Template.register_tag('example', Jekyll::ExampleBlock)
  Liquid::Template.register_tag('equation', Jekyll::EquationBlock)
