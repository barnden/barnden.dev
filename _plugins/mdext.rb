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
  class RemarkBlock < Liquid::Block
      def initialize(tag_name, text, tokens)
        super
      end
      require "kramdown"
      def render(context)
        content = super
        "<div class='block remark' markdown='1'>#{content}</div>"
      end
    end
  class ProofBlock < Liquid::Block
      def initialize(tag_name, text, tokens)
        super
      end
      require "kramdown"
      def render(context)
        content = super
        "<div class='block proof' markdown='1'>#{content}</div>"
      end
    end
  class TheoremBlock < Liquid::Block
      def initialize(tag_name, text, tokens)
        super
      end
      require "kramdown"
      def render(context)
        content = super
        "<div class='block theorem' markdown='1'>#{content}</div>"
      end
    end
  class ArchiveBlock < Liquid::Block
      def initialize(tag_name, text, tokens)
        super
      end
      require "kramdown"
      def render(context)
        content = super
        "<div class='block archive' markdown='1'>#{content}</div>"
      end
    end
  end

  Liquid::Template.register_tag('definition', Jekyll::DefinitionBlock)
  Liquid::Template.register_tag('example', Jekyll::ExampleBlock)
  Liquid::Template.register_tag('remark', Jekyll::RemarkBlock)
  Liquid::Template.register_tag('proof', Jekyll::ProofBlock)
  Liquid::Template.register_tag('theorem', Jekyll::TheoremBlock)
  Liquid::Template.register_tag('archive', Jekyll::ArchiveBlock)
